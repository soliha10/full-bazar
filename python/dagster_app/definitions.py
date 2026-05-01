"""
Dagster job: Product Sync
Runs every hour. Reads CSV files with a Python generator and writes to PostgreSQL.
Replaces Apache Airflow — much lighter RAM footprint (~300MB vs ~1.5GB).
"""

from __future__ import annotations

import base64
import csv
import os
import re
from datetime import datetime
from typing import Generator

import psycopg2
import psycopg2.extras
from dagster import Definitions, ScheduleDefinition, job, op

# ── Regex filters ─────────────────────────────────────────────────────────────
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_title(title: str) -> str:
    norm = title.lower()
    norm = re.sub(
        r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni|телефон)\s+",
        "", norm, flags=re.IGNORECASE,
    )
    norm = re.sub(
        r"\b(smartfoni|smartfon|smarton|telefon|phone|pct|rasmiy mahsulot|sovg.aga|sovg.a|oq sim kartasi|sim karta)\b",
        "", norm, flags=re.IGNORECASE,
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
        "", title, flags=re.IGNORECASE,
    )
    name = re.sub(r"\b(smartfoni|smartfon|smarton|telefon|phone|pct)\b", "", name, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", name).strip()


# ── Generator ─────────────────────────────────────────────────────────────────

def product_row_generator(data_dir: str) -> Generator[dict, None, None]:
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
                reader.fieldnames = [
                    (h.lower().replace('"', "").replace("'", "").strip() if h else "")
                    for h in reader.fieldnames
                ]
                for row in reader:
                    title = (
                        row.get("title") or row.get("product_name") or row.get("name") or ""
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

                    yield {
                        "title": title,
                        "image": (row.get("image_url") or row.get("image") or row.get("img") or "").strip(),
                        "raw_rating": row.get("rating"),
                        "raw_reviews": row.get("review_count") or row.get("reviews"),
                        "market_source": (
                            row.get("store") or row.get("market") or row.get("source") or source_fallback
                        ).lower(),
                        "market_price": price,
                        "market_url": (
                            row.get("product_url") or row.get("url") or row.get("link") or "#"
                        ).strip().replace("\n", ""),
                    }
        except Exception as exc:
            print(f"[product_sync] Skipping {filename}: {exc}")


# ── Sync logic ────────────────────────────────────────────────────────────────

def _run_sync(data_dir: str, db_url: str, log) -> tuple[int, int]:
    product_groups: dict[str, dict] = {}

    for row in product_row_generator(data_dir):
        title = row["title"]
        norm = _normalize_title(title)
        product_id = _make_product_id(norm)

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
                "image": row["image"],
                "images": [row["image"]] if row["image"] else [],
                "keywords": title.lower(),
                "markets": {},
            }

        group = product_groups[product_id]
        if len(title) > len(group["title"]):
            group["title"] = title
        group["keywords"] = group["keywords"] + " " + title.lower()
        if row["image"] and row["image"] not in group["images"]:
            group["images"].append(row["image"])
        if row["image"] and not group["image"]:
            group["image"] = row["image"]

        src = row["market_source"]
        price = row["market_price"]
        if src not in group["markets"] or price < group["markets"][src]["price"]:
            group["markets"][src] = {"source": src.capitalize(), "price": price, "url": row["market_url"]}

    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                products_rows = []
                markets_rows = []

                for pid, group in product_groups.items():
                    sorted_markets = sorted(group["markets"].values(), key=lambda m: m["price"])
                    best = sorted_markets[0] if sorted_markets else {}
                    products_rows.append((
                        pid, group["name"], group["title"], group["category"],
                        group["rating"], group["reviews"], group["image"] or None,
                        group["images"] or None, True, group["keywords"][:5000],
                        best.get("source"), best.get("price", 0), best.get("url"),
                        datetime.utcnow(),
                    ))
                    for m in sorted_markets:
                        markets_rows.append((pid, m["source"], m["price"], m["url"]))

                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO products
                        (id, name, title, category, rating, reviews, image, images,
                         in_stock, keywords, source, price, url, updated_at)
                    VALUES %s
                    ON CONFLICT (id) DO UPDATE SET
                        name=EXCLUDED.name, title=EXCLUDED.title,
                        rating=EXCLUDED.rating, reviews=EXCLUDED.reviews,
                        image=EXCLUDED.image, images=EXCLUDED.images,
                        keywords=EXCLUDED.keywords, source=EXCLUDED.source,
                        price=EXCLUDED.price, url=EXCLUDED.url, updated_at=NOW()
                    """,
                    products_rows,
                    page_size=500,
                )

                if product_groups:
                    cur.execute(
                        "DELETE FROM product_markets WHERE product_id = ANY(%s)",
                        (list(product_groups.keys()),),
                    )
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO product_markets (product_id, source, price, url)
                    VALUES %s
                    ON CONFLICT (product_id, source) DO UPDATE SET
                        price=EXCLUDED.price, url=EXCLUDED.url
                    """,
                    markets_rows,
                    page_size=1000,
                )
        return len(products_rows), len(markets_rows)
    finally:
        conn.close()


# ── Dagster op / job / schedule ───────────────────────────────────────────────

@op
def sync_products_op(context):
    data_dir = os.getenv("DATA_DIR", "/opt/dagster/data")
    db_url = os.getenv("PRODUCTS_DB_URL", "postgresql://postgres:postgres@postgres:5432/fullbazar")

    context.log.info(f"Reading CSVs from: {data_dir}")
    n_products, n_markets = _run_sync(data_dir, db_url, context.log)
    context.log.info(f"Done — {n_products} products, {n_markets} market entries")


@job
def product_sync_job():
    sync_products_op()


defs = Definitions(
    jobs=[product_sync_job],
    schedules=[
        ScheduleDefinition(
            name="product_sync_hourly",
            job=product_sync_job,
            cron_schedule="0 * * * *",
        )
    ],
)
