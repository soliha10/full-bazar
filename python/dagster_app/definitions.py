"""
Dagster job: Product Sync
Runs every hour. Reads CSV files with a Python generator and writes to PostgreSQL.
"""

from __future__ import annotations

import csv
import hashlib
import logging
import os
import re
import subprocess
import sys
import traceback
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, wait as futures_wait
from datetime import datetime
from typing import Generator

import psycopg2
import psycopg2.extras
from dagster import Definitions, ScheduleDefinition, job, op, in_process_executor

sys.path.insert(0, os.path.dirname(__file__))

logger = logging.getLogger(__name__)

# ── Column limits (match DB schema) ──────────────────────────────────────────
_MAX_URL     = 1999   # VARCHAR(2000)
_MAX_NAME    = 999    # VARCHAR(1000)
_MAX_KW      = 5000   # TEXT (kept short for performance)
_MAX_SOURCE  = 99     # VARCHAR(100)


def _trunc(s: str | None, limit: int) -> str | None:
    if not s:
        return s
    return s[:limit] if len(s) > limit else s


# ── Regex filters ─────────────────────────────────────────────────────────────
_SMARTPHONE_RE = re.compile(
    r"(iphone|samsung|redmi|xiaomi|oppo|vivo|realme|honor|smartfon|pixel|"
    r"huawei|смартфон|телефон|telefon|spark|tecno|camon|poco|itel|infinix)",
    re.IGNORECASE,
)
_NOT_SMARTPHONE_RE = re.compile(
    r"(televizor|noutbuk|laptop|planshet|plansheti|tablet|ipad|"
    r"galaxy\s*tab|galaxy\s*book|galaxy\s*watch|galaxy\s*buds|"
    r"smart\s*watch|smartwatch|soat\b|watch\b|"
    r"konditsioner|pylesos|changyutgich|holodilnik|sovutgich|"
    r"kir\s*yuvish|gaz\s*plita|"
    r"kabel|cable|провод|кабель|"
    r"chehol|case\b|cover\b|himoya\s*shisha|plyonka|плёнка|чехол|"
    r"zaryad|charger|adapter|адаптер|"
    r"quloqchin|naushnik|earphone|earbud|airpod|airdot|headphone|headset|наушник|"
    r"power\s*bank|powerbank|akkumulyator\b|"
    r"router|modem|wi-?fi|"
    r"macbook|планшет|ноутбук)",
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
    return "prod-" + hashlib.md5(norm.encode()).hexdigest()[:20]


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
    # Skip ML training files — they have different column schemas
    _SKIP_FILES = {"processed_matching_data.csv", "synthetic_matching_data.csv"}

    for filename in sorted(os.listdir(data_dir)):
        if not filename.endswith(".csv"):
            continue
        if filename in _SKIP_FILES:
            continue
        filepath = os.path.join(data_dir, filename)
        source_fallback = filename.replace("_products.csv", "").replace("_phones.csv", "").replace("-", "_").split("_")[0]
        try:
            with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as fh:
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

                    image = (row.get("image_url") or row.get("image") or row.get("img") or "").strip()
                    url = (row.get("product_url") or row.get("url") or row.get("link") or "#").strip().replace("\n", "")

                    yield {
                        "title": title,
                        "image": _trunc(image, _MAX_URL) or "",
                        "raw_rating": row.get("rating"),
                        "raw_reviews": row.get("review_count") or row.get("reviews"),
                        "market_source": (
                            row.get("store") or row.get("market") or row.get("source") or source_fallback
                        ).lower().strip(),
                        "market_price": price,
                        "market_url": _trunc(url, _MAX_URL) or "#",
                    }
        except Exception as exc:
            logger.warning(f"[product_sync] Skipping {filename}: {exc}")


# ── Sync logic ────────────────────────────────────────────────────────────────

_DIFF_WORDS_RE = re.compile(r'\b(max|plus|ultra|pro|lite|mini|fe|note|edge|fold|\d+gb|\d+tb|\d+\/\d+)\b')


def _get_cosine_sim(s1: str, s2: str) -> float:
    import math
    vec1 = Counter(re.findall(r'\w+', s1.lower()))
    vec2 = Counter(re.findall(r'\w+', s2.lower()))
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum(vec1[x] * vec2[x] for x in intersection)
    denominator = math.sqrt(sum(v**2 for v in vec1.values())) * math.sqrt(sum(v**2 for v in vec2.values()))
    return float(numerator) / denominator if denominator else 0.0


def _can_merge(norm1: str, norm2: str) -> bool:
    if _get_cosine_sim(norm1, norm2) < 0.85:
        return False
    return set(_DIFF_WORDS_RE.findall(norm1)) == set(_DIFF_WORDS_RE.findall(norm2))


# Minimum products required before we allow TRUNCATE+INSERT.
# Prevents wiping the DB when all scrapers fail or network is down.
_MIN_PRODUCTS_TO_SYNC = 50


def _run_sync(data_dir: str, db_url: str, log) -> tuple[int, int]:
    product_groups: dict[str, dict] = {}
    brand_groups: dict[str, list[str]] = {}
    norm_to_pid: dict[str, str] = {}

    BRANDS = ["apple", "samsung", "redmi", "xiaomi", "oppo", "vivo",
              "realme", "honor", "huawei", "tecno", "infinix", "itel", "poco"]

    for row in product_row_generator(data_dir):
        title = row["title"]
        norm = _normalize_title(title)

        brand = next((b for b in BRANDS if b in norm), "other")
        target_pid = norm_to_pid.get(norm)

        if not target_pid:
            for pid in brand_groups.get(brand, []):
                if _can_merge(norm, _normalize_title(product_groups[pid]["title"])):
                    target_pid = pid
                    norm_to_pid[norm] = pid
                    break

        if not target_pid:
            target_pid = _make_product_id(norm)
            norm_to_pid[norm] = target_pid
            brand_groups.setdefault(brand, []).append(target_pid)

            raw_rating = row["raw_rating"]
            rating = 4.5
            if raw_rating:
                try:
                    r = float(raw_rating)
                    if 1 <= r <= 5:
                        rating = round(r, 2)
                except (ValueError, TypeError):
                    pass
            else:
                id_hash = sum(ord(c) for c in target_pid)
                rating = round(3.5 + (id_hash % 16) / 10, 1)

            raw_reviews = row["raw_reviews"]
            reviews = 10
            if raw_reviews:
                try:
                    reviews = max(1, int(raw_reviews))
                except (ValueError, TypeError):
                    pass
            else:
                id_hash = sum(ord(c) for c in target_pid)
                reviews = (50 if rating >= 4.5 else 30 if rating >= 4.0 else 15) + (id_hash % 100)

            product_groups[target_pid] = {
                "id": target_pid,
                "name": _trunc(_make_display_name(title), _MAX_NAME) or title[:_MAX_NAME],
                "title": title,
                "category": "Phones",
                "rating": rating,
                "reviews": reviews,
                "image": row["image"],
                "images": [row["image"]] if row["image"] else [],
                "keywords": title.lower(),
                "markets": {},
            }

        group = product_groups[target_pid]
        if len(title) > len(group["title"]):
            group["title"] = title
            group["name"] = _trunc(_make_display_name(title), _MAX_NAME) or group["name"]
        group["keywords"] = (group["keywords"] + " " + title.lower())[:_MAX_KW]
        if row["image"] and row["image"] not in group["images"]:
            group["images"].append(row["image"])
        if row["image"] and not group["image"]:
            group["image"] = row["image"]

        src = row["market_source"][:_MAX_SOURCE]
        price = row["market_price"]
        if src not in group["markets"] or price < group["markets"][src]["price"]:
            group["markets"][src] = {
                "source": src.capitalize(),
                "price": price,
                "url": row["market_url"],
            }

    n_products = len(product_groups)

    # ── Safety guard: never truncate when we have too few products ──────────
    if n_products < _MIN_PRODUCTS_TO_SYNC:
        log.warning(
            f"[sync] Only {n_products} products found — minimum is {_MIN_PRODUCTS_TO_SYNC}. "
            f"Skipping TRUNCATE to preserve existing DB data."
        )
        return 0, 0

    log.info(f"[sync] Building DB rows for {n_products} products…")

    products_rows = []
    markets_rows = []
    seen_market_keys: set[tuple[str, str]] = set()

    for pid, group in product_groups.items():
        sorted_markets = sorted(group["markets"].values(), key=lambda m: m["price"])
        best = sorted_markets[0] if sorted_markets else {}
        products_rows.append((
            pid,
            group["name"],
            _trunc(group["title"], _MAX_NAME),
            group["category"],
            group["rating"],
            group["reviews"],
            group["image"] or None,
            group["images"] or None,
            True,
            group["keywords"],
            _trunc(best.get("source"), _MAX_SOURCE),
            best.get("price", 0),
            _trunc(best.get("url"), _MAX_URL),
            datetime.utcnow(),
        ))
        for m in sorted_markets:
            key = (pid, m["source"])
            if key in seen_market_keys:
                continue   # deduplicate just in case
            seen_market_keys.add(key)
            markets_rows.append((
                pid,
                _trunc(m["source"], _MAX_SOURCE),
                m["price"],
                _trunc(m["url"], _MAX_URL),
            ))

    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                # Drop the FK only if it actually exists — prevents lock on non-existent constraint
                cur.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.table_constraints
                            WHERE constraint_name = 'user_events_product_id_fkey'
                              AND table_name = 'user_events'
                        ) THEN
                            ALTER TABLE user_events DROP CONSTRAINT user_events_product_id_fkey;
                        END IF;
                    END $$;
                """)
                cur.execute("TRUNCATE product_markets, products CASCADE")

                if products_rows:
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
                            updated_at = EXCLUDED.updated_at
                        """,
                        products_rows,
                        page_size=500,
                    )

                if markets_rows:
                    psycopg2.extras.execute_values(
                        cur,
                        """
                        INSERT INTO product_markets (product_id, source, price, url)
                        VALUES %s
                        ON CONFLICT (product_id, source) DO UPDATE SET
                            price = EXCLUDED.price,
                            url   = EXCLUDED.url
                        """,
                        markets_rows,
                        page_size=1000,
                    )

        return len(products_rows), len(markets_rows)
    finally:
        conn.close()


# ── Dagster ops ───────────────────────────────────────────────────────────────

def _scrape_with_timeout(scraper_cls, data_dir: str):
    try:
        s = scraper_cls(output_dir=data_dir, delay=1.0)
        count = s.run()
        return scraper_cls.store_name, count, None
    except Exception as exc:
        return scraper_cls.store_name, 0, str(exc)


@op
def scrape_all_op(context) -> str:
    import signal
    import gc

    data_dir = os.getenv("DATA_DIR", "/opt/dagster/data")
    os.makedirs(data_dir, exist_ok=True)

    try:
        from scrapers import ALL_SCRAPERS
    except ImportError as exc:
        context.log.warning(f"Scrapers not available: {exc}. Skipping scrape step.")
        return data_dir

    context.log.info(f"Starting {len(ALL_SCRAPERS)} scrapers → {data_dir}")

    SCRAPE_TIMEOUT = 18 * 60  # 18 minutes hard limit

    class _ScrapingTimeout(Exception):
        pass

    def _alarm_handler(signum, frame):
        raise _ScrapingTimeout("Scraping hard timeout reached")

    signal.signal(signal.SIGALRM, _alarm_handler)
    signal.alarm(SCRAPE_TIMEOUT)

    total_ok = 0
    total_fail = 0
    pool = ThreadPoolExecutor(max_workers=1)
    try:
        futures = {pool.submit(_scrape_with_timeout, cls, data_dir): cls for cls in ALL_SCRAPERS}
        done, not_done = futures_wait(futures, timeout=SCRAPE_TIMEOUT - 30)

        for fut in done:
            name, count, err = fut.result()
            if err:
                context.log.warning(f"  [{name}] FAILED: {err}")
                total_fail += 1
            else:
                context.log.info(f"  [{name}] {count} products")
                total_ok += 1
            gc.collect()

        if not_done:
            names = [futures[f].store_name for f in not_done]
            context.log.warning(f"  TIMEOUT — skipped scrapers: {names}")

    except _ScrapingTimeout:
        context.log.warning(f"scrape_all_op: hard timeout ({SCRAPE_TIMEOUT}s) — moving on")
    except Exception as exc:
        context.log.error(f"scrape_all_op unexpected error: {exc}\n{traceback.format_exc()}")
    finally:
        signal.alarm(0)
        pool.shutdown(wait=False)
        gc.collect()

    context.log.info(f"Scraping done — {total_ok} ok, {total_fail} failed")
    return data_dir


@op
def sync_products_op(context, data_dir: str) -> str:
    db_url = os.getenv("PRODUCTS_DB_URL", "postgresql://postgres:postgres@postgres:5432/fullbazar")
    context.log.info(f"Reading CSVs from: {data_dir}")

    try:
        n_products, n_markets = _run_sync(data_dir, db_url, context.log)
        if n_products == 0:
            context.log.warning("sync_products_op: no DB update performed (guard triggered or no data)")
        else:
            context.log.info(f"Done — {n_products} products, {n_markets} market entries written to DB")
    except psycopg2.Error as exc:
        # Full traceback so we can diagnose DB errors without SSH-ing in
        context.log.error(
            f"sync_products_op DB error: {exc}\n"
            f"pgcode={getattr(exc, 'pgcode', '?')} pgerror={getattr(exc, 'pgerror', '?')}\n"
            f"{traceback.format_exc()}"
        )
        raise
    except Exception as exc:
        context.log.error(f"sync_products_op FAILED:\n{traceback.format_exc()}")
        raise

    return data_dir


@op
def train_matcher_op(context, data_dir: str):
    """
    Rebuild the product-matching ML model after each scrape cycle.

    Runs in a SUBPROCESS to isolate heavy ML imports (sklearn, pandas, mlflow)
    from the dagster-daemon process — prevents OOM in the 512 MB container.
    """
    mlflow_uri  = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")
    ml_tasks_dir = os.getenv("ML_TASKS_DIR", "/opt/dagster/ml_tasks")
    script_path  = os.path.join(os.path.dirname(__file__), "_run_ml.py")

    if not os.path.isdir(ml_tasks_dir):
        context.log.info(f"[train_matcher] ml_tasks dir not found at {ml_tasks_dir}, skipping")
        return

    if not os.path.exists(script_path):
        context.log.warning(f"[train_matcher] _run_ml.py not found at {script_path}, skipping")
        return

    context.log.info(f"[train_matcher] Starting ML training subprocess…")
    try:
        result = subprocess.run(
            [sys.executable, script_path, data_dir, mlflow_uri, ml_tasks_dir],
            timeout=10 * 60,       # 10-minute hard cap
            capture_output=True,
            text=True,
            env=os.environ.copy(),
        )
        if result.stdout:
            context.log.info(f"[train_matcher] stdout:\n{result.stdout[-3000:]}")
        if result.returncode != 0:
            context.log.warning(
                f"[train_matcher] subprocess exited {result.returncode}.\n"
                f"stderr: {result.stderr[-3000:]}"
            )
        else:
            context.log.info("[train_matcher] training complete")
    except subprocess.TimeoutExpired:
        context.log.warning("[train_matcher] subprocess timed out after 10 min — skipping")
    except Exception as exc:
        context.log.warning(f"[train_matcher] skipped — {exc}\n{traceback.format_exc()}")


@op
def data_dir_op(context) -> str:
    data_dir = os.getenv("DATA_DIR", "/opt/dagster/data")
    os.makedirs(data_dir, exist_ok=True)
    context.log.info(f"Using data_dir: {data_dir}")
    return data_dir


# ── Jobs ──────────────────────────────────────────────────────────────────────

@job(executor_def=in_process_executor)
def product_sync_job():
    """Scrape → sync DB → train ML model (ML runs in subprocess)."""
    train_matcher_op(sync_products_op(scrape_all_op()))


@job(executor_def=in_process_executor)
def csv_sync_job():
    """Sync git-committed CSVs → PostgreSQL (no scraping). Used after deploy."""
    sync_products_op(data_dir_op())


# ── Definitions ───────────────────────────────────────────────────────────────

defs = Definitions(
    jobs=[product_sync_job, csv_sync_job],
    schedules=[
        ScheduleDefinition(
            name="csv_sync_hourly",
            job=csv_sync_job,
            cron_schedule="0 * * * *",
        ),
        ScheduleDefinition(
            name="product_sync_daily",
            job=product_sync_job,
            cron_schedule="0 3 * * *",
        ),
    ],
)
