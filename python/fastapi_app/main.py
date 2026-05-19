"""
FastAPI service — serves product data from PostgreSQL.
"""

from __future__ import annotations

import math
import os
import pickle
import re
from collections import Counter
from contextlib import asynccontextmanager
from typing import Any, Optional

import asyncpg
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@postgres:5432/fullbazar",
)
MODEL_PATH = os.getenv("MODEL_PATH", "/app/data/models/best_matcher.pkl")


# ── ML matcher (loaded once at startup) ──────────────────────────────────────
# Mirrors the feature set in python/ml_tasks/train_matcher.py exactly.
# If the model file doesn't exist yet (before first training run), all
# /api/ml/match requests fall back to plain cosine similarity.

_BRANDS = [
    "apple", "samsung", "xiaomi", "redmi", "oppo", "vivo", "realme",
    "honor", "huawei", "tecno", "infinix", "poco", "itel",
]
_STORAGE_RE = re.compile(r"(\d+)\s*(?:gb|tb)", re.I)
_DIFF_RE = re.compile(
    r"\b(pro|max|plus|ultra|lite|mini|fe|note|edge|fold|se|\d+)\b", re.I
)

_matcher: dict | None = None  # {"model": ..., "vectorizer": ..., "features": [...]}


def _load_matcher() -> dict | None:
    global _matcher
    if _matcher is not None:
        return _matcher
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _matcher = pickle.load(f)
            print(f"Loaded matcher model from {MODEL_PATH}")
        except Exception as e:
            print(f"Failed to load matcher model: {e}")
    return _matcher


def _extract_storage(text: str) -> str:
    m = _STORAGE_RE.search(text)
    return m.group(1).lower() if m else ""


def _extract_brand(text: str) -> str:
    text = text.lower()
    for b in _BRANDS:
        if b in text:
            return b
    return ""


def _jaccard(a: str, b: str) -> float:
    wa, wb = set(a.split()), set(b.split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _diff_tokens(text: str) -> frozenset:
    return frozenset(_DIFF_RE.findall(text.lower()))


def _cosine_sim_words(s1: str, s2: str) -> float:
    """Word-level cosine similarity — fallback when no trained model."""
    v1 = Counter(re.findall(r"\w+", s1.lower()))
    v2 = Counter(re.findall(r"\w+", s2.lower()))
    shared = set(v1) & set(v2)
    num = sum(v1[x] * v2[x] for x in shared)
    den = math.sqrt(sum(v ** 2 for v in v1.values())) * math.sqrt(sum(v ** 2 for v in v2.values()))
    return float(num) / den if den else 0.0


def _ml_match(name_a: str, name_b: str) -> tuple[float, bool, str]:
    """Return (score, is_match, model_used)."""
    matcher = _load_matcher()

    if matcher is None:
        score = _cosine_sim_words(name_a, name_b)
        return score, score > 0.65, "cosine_baseline"

    import numpy as np
    from sklearn.metrics.pairwise import paired_cosine_distances

    a, b = name_a.lower(), name_b.lower()
    vec = matcher["vectorizer"]
    va = vec.transform([a])
    vb = vec.transform([b])
    cosine_sim = float(1 - paired_cosine_distances(va, vb)[0])

    features = np.array([[
        cosine_sim,
        _jaccard(a, b),
        int(_extract_brand(a) == _extract_brand(b)),
        int(bool(_extract_brand(a)) and bool(_extract_brand(b))),
        int(
            bool(_extract_storage(a)) and bool(_extract_storage(b))
            and _extract_storage(a) != _extract_storage(b)
        ),
        1.0 if _diff_tokens(a) == _diff_tokens(b) else 0.0,
        min(max(len(a) / max(len(b), 1), 0.0), 3.0),
    ]])

    score = float(matcher["model"].predict_proba(features)[0][1])
    is_match = bool(matcher["model"].predict(features)[0] == 1)
    return score, is_match, "trained_classifier"


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    _load_matcher()  # warm up model at startup
    yield
    await app.state.pool.close()


app = FastAPI(title="Full-Bazar API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── ML endpoints ──────────────────────────────────────────────────────────────

@app.get("/api/ml/match")
async def ml_match(name_a: str, name_b: str):
    score, is_match, model_used = _ml_match(name_a, name_b)
    return {
        "score": round(score, 4),
        "is_match": is_match,
        "model": model_used,
        "recommendation": "Match" if is_match else "Different Product",
    }


@app.get("/api/ml/samples")
async def ml_samples():
    """Test pairs with expected outcomes — useful for smoke-testing the model."""
    cases = [
        {"a": "Apple iPhone 14 Pro 128GB Black", "b": "iPhone 14 Pro 128 GB (Black)", "expected": True},
        {"a": "Samsung Galaxy S23 Ultra", "b": "Samsung S23 Ultra 256GB", "expected": True},
        {"a": "Xiaomi Redmi Note 12", "b": "Redmi Note 12 Pro", "expected": False},
        {"a": "iPhone 15 128GB", "b": "iPhone 15 256GB", "expected": False},
        {"a": "Samsung Galaxy A54 128GB", "b": "Samsung Galaxy A54 256GB", "expected": False},
    ]
    results = []
    for c in cases:
        score, is_match, model = _ml_match(c["a"], c["b"])
        results.append({**c, "score": round(score, 4), "predicted": is_match, "model": model})
    return results


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_product(row: asyncpg.Record, markets: list[dict]) -> dict[str, Any]:
    sorted_markets = sorted(markets, key=lambda m: m["price"])
    best = sorted_markets[0] if sorted_markets else {}
    return {
        "id": row["id"],
        "name": row["name"],
        "title": row["title"],
        "category": row["category"],
        "rating": float(row["rating"] or 4.5),
        "reviews": row["reviews"] or 10,
        "image": row["image"] or "",
        "images": list(row["images"] or []),
        "inStock": row["in_stock"],
        "keywords": row["keywords"] or "",
        "source": best.get("source", row["source"] or ""),
        "price": float(best.get("price", row["price"] or 0)),
        "url": best.get("url", row["url"] or "#"),
        "markets": sorted_markets,
    }


async def _fetch_markets(pool: asyncpg.Pool, product_ids: list[str]) -> dict[str, list[dict]]:
    if not product_ids:
        return {}
    rows = await pool.fetch(
        "SELECT product_id, source, price, url FROM product_markets WHERE product_id = ANY($1) ORDER BY price",
        product_ids,
    )
    result: dict[str, list[dict]] = {pid: [] for pid in product_ids}
    for r in rows:
        result[r["product_id"]].append({
            "source": r["source"],
            "price": float(r["price"]),
            "url": r["url"] or "#",
        })
    return result


# ── Products ──────────────────────────────────────────────────────────────────

@app.get("/api/products")
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=200),
    search: str = Query(""),
    market: str = Query(""),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    offset = (page - 1) * limit
    search = search.strip()
    market = market.strip().lower()

    where_parts: list[str] = []
    params: list = []

    if search:
        for token in search.lower().split():
            params.append(f"%{token}%")
            i = len(params)
            where_parts.append(f"(lower(p.name) LIKE ${i} OR lower(p.keywords) LIKE ${i})")

    if market:
        markets_list = [m.strip() for m in market.split(",") if m.strip()]
        if markets_list:
            params.append(markets_list)
            i = len(params)
            where_parts.append(
                f"EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id AND lower(pm.source) = ANY(${i}::text[]))"
            )

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    count_row = await pool.fetchrow(f"SELECT COUNT(*) FROM products p {where_sql}", *params)
    total: int = count_row[0]

    rows = await pool.fetch(
        f"SELECT p.* FROM products p {where_sql} ORDER BY p.price ASC LIMIT ${len(params)+1} OFFSET ${len(params)+2}",
        *params, limit, offset,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]

    return {"products": products, "total": total, "page": page, "limit": limit, "hasMore": offset + limit < total}


@app.get("/api/products/{product_id}")
async def get_product(product_id: str) -> dict:
    pool: asyncpg.Pool = app.state.pool
    row = await pool.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not Found")
    markets_map = await _fetch_markets(pool, [product_id])
    return _row_to_product(row, markets_map.get(product_id, []))


# ── Recommendations ───────────────────────────────────────────────────────────

@app.get("/api/recommendations")
async def get_recommendations(limit: int = Query(4, ge=1, le=10)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        """
        WITH market_stats AS (
            SELECT product_id,
                   MIN(price) as min_price,
                   MAX(price) as max_price,
                   COUNT(*) as market_count
            FROM product_markets
            GROUP BY product_id
            HAVING COUNT(*) > 1
        )
        SELECT p.*, ms.max_price - ms.min_price as savings
        FROM products p
        JOIN market_stats ms ON p.id = ms.product_id
        ORDER BY savings DESC
        LIMIT $1
        """,
        limit,
    )
    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    return {"products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]}


@app.get("/api/recommendations/personalized")
async def get_personalized_recommendations(
    session_id: str = Query(...),
    limit: int = Query(8, ge=1, le=20),
) -> dict:
    pool: asyncpg.Pool = app.state.pool

    # Fetch recent events with timestamps for time-decay scoring
    event_rows = await pool.fetch(
        """
        SELECT product_id, event_type,
               EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 AS hours_ago
        FROM user_events
        WHERE session_id = $1
          AND product_id IS NOT NULL
          AND event_type IN ('view', 'search', 'cart_add')
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 50
        """,
        session_id,
    )

    if not event_rows:
        # Cold start: fall back to best price-diff products
        rows = await pool.fetch(
            """
            WITH ms AS (
                SELECT product_id, MIN(price) AS lo, MAX(price) AS hi
                FROM product_markets GROUP BY product_id HAVING COUNT(*) > 1
            )
            SELECT p.* FROM products p
            JOIN ms ON p.id = ms.product_id
            ORDER BY (ms.hi - ms.lo) DESC
            LIMIT $1
            """,
            limit,
        )
        product_ids = [r["id"] for r in rows]
        markets_map = await _fetch_markets(pool, product_ids)
        return {"products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows], "type": "popular"}

    # Score each product using event type weight + exponential time decay.
    # cart_add is the strongest signal (3×), view is baseline (1×).
    # Decay half-life ≈ 7 hours: score halves every 7 hours of inactivity.
    EVENT_WEIGHTS = {"view": 1.0, "search": 1.5, "cart_add": 3.0}
    DECAY_RATE = math.log(2) / 7.0  # λ for 7-hour half-life

    product_scores: dict[str, float] = {}
    for r in event_rows:
        pid = r["product_id"]
        weight = EVENT_WEIGHTS.get(r["event_type"], 1.0)
        decay = math.exp(-DECAY_RATE * float(r["hours_ago"]))
        product_scores[pid] = product_scores.get(pid, 0.0) + weight * decay

    viewed_ids = list(product_scores.keys())
    # Top-scored products define the user profile
    top_viewed = sorted(viewed_ids, key=product_scores.get, reverse=True)[:10]

    profile_rows = await pool.fetch(
        "SELECT category, AVG(price) AS avg_price FROM products WHERE id = ANY($1) GROUP BY category",
        top_viewed,
    )
    if not profile_rows:
        return {"products": [], "type": "empty"}

    brand_rows = await pool.fetch(
        "SELECT lower(split_part(name, ' ', 1)) AS brand FROM products WHERE id = ANY($1)",
        top_viewed,
    )
    brands = list({r["brand"] for r in brand_rows if r["brand"]})
    categories = [r["category"] for r in profile_rows]
    avg_price = float(sum(r["avg_price"] for r in profile_rows) / len(profile_rows))

    rows = await pool.fetch(
        """
        SELECT p.*,
            CASE WHEN lower(split_part(p.name, ' ', 1)) = ANY($4::text[]) THEN 2 ELSE 1 END AS boost
        FROM products p
        WHERE p.category = ANY($1::text[])
          AND p.id != ALL($2::text[])
          AND p.price BETWEEN $3 * 0.4 AND $3 * 2.5
        ORDER BY boost DESC, p.rating DESC
        LIMIT $5
        """,
        categories, viewed_ids, avg_price, brands, limit,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    return {
        "products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows],
        "type": "personalized",
    }


# ── Other endpoints ───────────────────────────────────────────────────────────

@app.get("/api/markets")
async def get_markets() -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        "SELECT lower(source) AS key, source AS name, COUNT(*) AS count FROM product_markets GROUP BY source ORDER BY count DESC"
    )
    return {"markets": [{"key": r["key"], "name": r["name"], "count": r["count"]} for r in rows]}


class TrackEvent(BaseModel):
    session_id: str
    event_type: str  # 'view' | 'search' | 'cart_add'
    product_id: Optional[str] = None
    search_query: Optional[str] = None


@app.post("/api/track")
async def track_event(event: TrackEvent):
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        "INSERT INTO user_events (session_id, event_type, product_id, search_query) VALUES ($1, $2, $3, $4)",
        event.session_id, event.event_type, event.product_id, event.search_query,
    )
    return {"ok": True}


@app.get("/health")
async def health() -> dict:
    matcher = _load_matcher()
    return {"status": "ok", "matcher_model": "loaded" if matcher else "not_trained_yet"}


@app.get("/api/stats")
async def stats() -> dict:
    pool: asyncpg.Pool = app.state.pool
    row = await pool.fetchrow(
        """
        SELECT
            (SELECT COUNT(*) FROM products) AS total_products,
            (SELECT MAX(updated_at) FROM products) AS last_sync,
            (SELECT COUNT(DISTINCT source) FROM product_markets) AS total_markets
        """
    )
    markets_rows = await pool.fetch(
        "SELECT source, COUNT(*) AS count FROM product_markets GROUP BY source ORDER BY count DESC"
    )
    return {
        "total_products": row["total_products"],
        "last_sync": row["last_sync"].isoformat() if row["last_sync"] else None,
        "total_markets": row["total_markets"],
        "markets": [{"source": r["source"], "count": r["count"]} for r in markets_rows],
    }
