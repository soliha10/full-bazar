"""
Airflow DAG: Product Sync
Runs every hour. Reads CSV files with a Python generator and writes to PostgreSQL.
"""

from __future__ import annotations

import base64
import csv
import os
import random
import re
from datetime import datetime, timedelta
from typing import Generator

import psycopg2
import psycopg2.extras
from airflow import DAG
from airflow.operators.python import PythonOperator

# ── Regex filters (same logic as the Node.js server) ─────────────────────────
_SMARTPHONE_RE = re.compile(
    r"(iphone|samsung|redmi|xiaomi|oppo|vivo|realme|honor|smartfon|pixel|"
    r"huawei|смартфон|телефон|telefon|spark|tecno|camon|poco|itel|infinix)",
    re.IGNORECASE,
)
_NOT_SMARTPHONE_RE = re.compile(
    r"(televizor|noutbuk|laptop|planshet|tablet|konditsioner|pylesos|"
    r"changyutgich|holodilnik|sovutgich|kir yuvish|gaz plita|kabel|chehol|"
    r"case|zaryad|charger|adapter|планшет|чехол|кабель|заряд|наушник|quloqchin)",
    re.IGNORECASE,
)


# ── Helper functions ─────────────────────────────────────────────────────────

def _normalize_title(title: str) -> str:
    norm = title.lower()
    norm = re.sub(
        r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni|телефон)\s+",
        "",
        norm,
        flags=re.IGNORECASE,
    )
    norm = re.sub(
        r"\b(smartfoni|smartfon|smarton|telefon|phone|pct|rasmiy mahsulot|sovg.aga|sovg.a|oq sim kartasi|sim karta)\b",
        "",
        norm,
        flags=re.IGNORECASE,
    )
    norm = re.sub(r"[.,\/#!$%\^&\*;:{}=\-_`~()]", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    return norm if len(norm) >= 3 else title.lower().strip()


def _make_product_id(norm: str) -> str:
    encoded = base64.b64encode(norm.encode()).decode()
    clean = re.sub(r"[^a-zA-Z0-9]", "", encoded)[:24]
    return f"prod-{clean}"


def _parse_price(raw: str) -> float:
    return float(re.sub(r"[^\d.]", "", str(raw).replace(" ", "")) or "0")


def _make_display_name(title: str) -> str:
    name = re.sub(
        r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+",
        "",
        title,
        flags=re.IGNORECASE,
    )
    name = re.sub(r"\b(smartfoni|smartfon|smarton|telefon|phone|pct)\b", "", name, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", name).strip()


# ── Core generator ────────────────────────────────────────────────────────────

def product_row_generator(data_dir: str) -> Generator[dict, None, None]:
    """
    Yields one dict per valid CSV row (smartphone, price >= 100 000 UZS).
    This is the Python generator the DAG uses to stream data without loading
    all CSV files into memory at once.
    """
    for filename in sorted(os.listdir(data_dir)):
        if not filename.endswith(".csv"):
            continue

        filepath = os.path.join(data_dir, filename)
        source_fallback = filename.replace("_products.csv", "").replace("-", "_").split("_")[0]

        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as fh:
                reader = csv.DictReader(fh)
                if reader.fieldnames is None:
                    continue

                # Normalize header names
                reader.fieldnames = [
                    (h.lower().replace('"', "").replace("'", "").strip() if h else "")
                    for h in reader.fieldnames
                ]

                for row in reader:
                    title = (
                        row.get("title")
                        or row.get("product_name")
                        or row.get("name")
                        or ""
                    ).strip()
                    if not title:
                        continue

                    if not _SMARTPHONE_RE.search(title):
                        continue
                    if _NOT_SMARTPHONE_RE.search(title):
                        continue

                    raw_price = row.get("actual_price") or row.get("price") or "0"
                    price_str = str(raw_price).lower()
                    if "oyiga" in price_str or " x " in price_str:
                        raw_price = row.get("old_price") or row.get("price") or "0"

                    price = _parse_price(str(raw_price))
                    if price < 100_000:
                        continue

                    market_source = (
                        row.get("store") or row.get("market") or row.get("source") or source_fallback
                    )
                    product_url = (
                        row.get("product_url") or row.get("url") or row.get("link") or "#"
                    ).strip().replace("\n", "")
                    image_url = (
                        row.get("image_url") or row.get("image") or row.get("img") or ""
                    ).strip().replace("\n", "")

                    raw_rating = row.get("rating")
                    raw_reviews = row.get("review_count") or row.get("reviews")

                    yield {
                        "title": title,
                        "image": image_url,
                        "raw_rating": raw_rating,
                        "raw_reviews": raw_reviews,
                        "market_source": market_source.lower(),
                        "market_price": price,
                        "market_url": product_url,
                    }

        except Exception as exc:
            print(f"[product_sync] Skipping {filename}: {exc}")


# ── DAG task ──────────────────────────────────────────────────────────────────

def sync_products_to_db(**_kwargs) -> None:
    data_dir = os.getenv("DATA_DIR", "/opt/airflow/data")
    db_url = os.getenv("PRODUCTS_DB_URL", "postgresql://postgres:postgres@postgres:5432/fullbazar")

    # Aggregate all rows into product groups (same as Node.js server)
    product_groups: dict[str, dict] = {}

    for row in product_row_generator(data_dir):
        title = row["title"]
        norm = _normalize_title(title)
        product_id = _make_product_id(norm)

        source_key = row["market_source"]
        price = row["market_price"]
        image = row["image"]

        if product_id not in product_groups:
            raw_rating = row["raw_rating"]
            rating = 4.5
            if raw_rating:
                try:
                    r = float(raw_rating)
                    if 1 <= r <= 5:
                        rating = round(r, 2)
                except ValueError:
                    pass
            else:
                # deterministic pseudo-random based on id
                id_hash = sum(ord(c) for c in product_id)
                rating = round(3.5 + (id_hash % 16) / 10, 1)

            raw_reviews = row["raw_reviews"]
            reviews = 10
            if raw_reviews:
                try:
                    reviews = int(raw_reviews)
                except ValueError:
                    pass
            else:
                id_hash = sum(ord(c) for c in product_id)
                base = 50 if rating >= 4.5 else (30 if rating >= 4.0 else 15)
                reviews = base + (id_hash % 100)

            product_groups[product_id] = {
                "id": product_id,
                "name": _make_display_name(title),
                "title": title,
                "category": "Phones",
                "rating": rating,
                "reviews": reviews,
                "image": image,
                "images": [image] if image else [],
                "keywords": title.lower(),
                "markets": {},
            }

        group = product_groups[product_id]

        # Update title if longer
        if len(title) > len(group["title"]):
            group["title"] = title
        group["keywords"] = group["keywords"] + " " + title.lower()

        # Collect images
        if image and image not in group["images"]:
            group["images"].append(image)
        if image and not group["image"]:
            group["image"] = image

        # Keep lowest price per market
        if source_key not in group["markets"] or price < group["markets"][source_key]["price"]:
            group["markets"][source_key] = {
                "source": source_key.capitalize(),
                "price": price,
                "url": row["market_url"],
            }

    # Write to PostgreSQL
    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                products_to_upsert = []
                markets_to_upsert = []

                for pid, group in product_groups.items():
                    sorted_markets = sorted(group["markets"].values(), key=lambda m: m["price"])
                    best = sorted_markets[0] if sorted_markets else {}

                    products_to_upsert.append((
                        pid,
                        group["name"],
                        group["title"],
                        group["category"],
                        group["rating"],
                        group["reviews"],
                        group["image"] or None,
                        group["images"] or None,
                        True,
                        group["keywords"][:5000],
                        best.get("source"),
                        best.get("price", 0),
                        best.get("url"),
                    ))

                    for market in sorted_markets:
                        markets_to_upsert.append((pid, market["source"], market["price"], market["url"]))

                # Upsert products
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO products
                        (id, name, title, category, rating, reviews, image, images,
                         in_stock, keywords, source, price, url, updated_at)
                    VALUES %s
                    ON CONFLICT (id) DO UPDATE SET
                        name       = EXCLUDED.name,
                        title      = EXCLUDED.title,
                        rating     = EXCLUDED.rating,
                        reviews    = EXCLUDED.reviews,
                        image      = EXCLUDED.image,
                        images     = EXCLUDED.images,
                        keywords   = EXCLUDED.keywords,
                        source     = EXCLUDED.source,
                        price      = EXCLUDED.price,
                        url        = EXCLUDED.url,
                        updated_at = NOW()
                    """,
                    [(
                        p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7],
                        p[8], p[9], p[10], p[11], p[12], datetime.utcnow(),
                    ) for p in products_to_upsert],
                    template="(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    page_size=500,
                )

                # Delete stale markets then re-insert
                stale_ids = list(product_groups.keys())
                if stale_ids:
                    cur.execute(
                        "DELETE FROM product_markets WHERE product_id = ANY(%s)",
                        (stale_ids,),
                    )

                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO product_markets (product_id, source, price, url)
                    VALUES %s
                    ON CONFLICT (product_id, source) DO UPDATE SET
                        price = EXCLUDED.price,
                        url   = EXCLUDED.url
                    """,
                    markets_to_upsert,
                    page_size=1000,
                )

        print(
            f"[product_sync] Done — {len(products_to_upsert)} products, "
            f"{len(markets_to_upsert)} market entries"
        )
    finally:
        conn.close()


# ── DAG definition ────────────────────────────────────────────────────────────

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": False,
}

with DAG(
    dag_id="product_sync",
    default_args=default_args,
    description="Reads CSV files every hour via a Python generator and writes to PostgreSQL",
    schedule_interval="@hourly",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["fullbazar", "etl"],
) as dag:

    sync_task = PythonOperator(
        task_id="sync_products_to_postgres",
        python_callable=sync_products_to_db,
        doc_md="""
        ## Product Sync Task
        Streams all CSV files through a Python **generator** (`product_row_generator`),
        groups products by normalized title, then batch-upserts into PostgreSQL.
        """,
    )
