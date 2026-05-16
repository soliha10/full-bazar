"""
FastAPI service — serves product data from PostgreSQL.
Mirrors the Node.js /api/products and /api/products/:id endpoints.
"""

from __future__ import annotations

import os
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


# ── Lifespan (connection pool) ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    yield
    await app.state.pool.close()


import re
import math
from collections import Counter

app = FastAPI(title="Full-Bazar API", lifespan=lifespan)

# ── AI Matching Logic (Lite Version for UI Demo) ──────────────────────────────
def get_cosine_sim(s1: str, s2: str) -> float:
    s1, s2 = s1.lower(), s2.lower()
    vec1 = Counter(re.findall(r'\w+', s1))
    vec2 = Counter(re.findall(r'\w+', s2))
    
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    return float(numerator) / denominator

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/api/ml/match")
async def ml_match(name_a: str, name_b: str):
    score = get_cosine_sim(name_a, name_b)
    # Simple threshold from our model analysis
    is_match = score > 0.65
    return {
        "score": round(score, 4),
        "is_match": is_match,
        "recommendation": "Match" if is_match else "Different Product"
    }

@app.get("/api/ml/samples")
async def ml_samples():
    # Demonstrating logic with synthetic data patterns
    return [
        {"a": "Apple iPhone 14 Pro 128GB Black", "b": "iPhone 14 Pro 128 GB (Black)", "expected": True},
        {"a": "Samsung Galaxy S23 Ultra", "b": "Samsung S23 Ultra 256GB", "expected": True},
        {"a": "Xiaomi Redmi Note 12", "b": "Redmi Note 12 Pro", "expected": False},
        {"a": "Sony PlayStation 5", "b": "PS5 Console Digital Edition", "expected": True},
        {"a": "MacBook Air M2", "b": "MacBook Pro M2 13-inch", "expected": False},
    ]


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
        """
        SELECT product_id, source, price, url
        FROM product_markets
        WHERE product_id = ANY($1)
        ORDER BY price
        """,
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


# ── Routes ────────────────────────────────────────────────────────────────────

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
        # filter: product must be available in at least one of the requested markets
        markets_list = [m.strip() for m in market.split(",") if m.strip()]
        if markets_list:
            params.append(markets_list)
            i = len(params)
            where_parts.append(
                f"EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id AND lower(pm.source) = ANY(${i}::text[]))"
            )

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    count_row = await pool.fetchrow(
        f"SELECT COUNT(*) FROM products p {where_sql}", *params
    )
    total: int = count_row[0]

    rows = await pool.fetch(
        f"SELECT p.* FROM products p {where_sql} ORDER BY p.price ASC LIMIT ${len(params)+1} OFFSET ${len(params)+2}",
        *params, limit, offset,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]

    return {
        "products": products,
        "total": total,
        "page": page,
        "limit": limit,
        "hasMore": offset + limit < total,
    }


@app.get("/api/products/{product_id}")
async def get_product(product_id: str) -> dict:
    pool: asyncpg.Pool = app.state.pool

    row = await pool.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not Found")

    markets_map = await _fetch_markets(pool, [product_id])
    return _row_to_product(row, markets_map.get(product_id, []))


@app.get("/api/recommendations")
async def get_recommendations(limit: int = Query(4, ge=1, le=10)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    
    # Logic: Find products that have multiple markets and the highest (max_price - min_price)
    rows = await pool.fetch(
        """
        WITH market_stats AS (
            SELECT 
                product_id, 
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
        limit
    )
    
    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]
    
    return {"products": products}

@app.get("/api/markets")
async def get_markets() -> dict:
    """Return distinct markets available in the DB with product counts."""
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        """
        SELECT lower(source) AS key, source AS name, COUNT(*) AS count
        FROM product_markets
        GROUP BY source
        ORDER BY count DESC
        """
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
        """
        INSERT INTO user_events (session_id, event_type, product_id, search_query)
        VALUES ($1, $2, $3, $4)
        """,
        event.session_id, event.event_type, event.product_id, event.search_query,
    )
    return {"ok": True}


@app.get("/api/recommendations/personalized")
async def get_personalized_recommendations(
    session_id: str = Query(...),
    limit: int = Query(8, ge=1, le=20),
) -> dict:
    pool: asyncpg.Pool = app.state.pool

    view_rows = await pool.fetch(
        """
        SELECT DISTINCT product_id
        FROM user_events
        WHERE session_id = $1
          AND event_type = 'view'
          AND product_id IS NOT NULL
          AND created_at > NOW() - INTERVAL '7 days'
        LIMIT 20
        """,
        session_id,
    )
    viewed_ids = [r["product_id"] for r in view_rows]

    if not viewed_ids:
        # No history → fallback to best price-diff products
        rows = await pool.fetch(
            """
            WITH ms AS (
                SELECT product_id, MIN(price) as lo, MAX(price) as hi
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
        products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]
        return {"products": products, "type": "popular"}

    # Build user profile: categories + avg price
    profile_rows = await pool.fetch(
        "SELECT category, AVG(price) as avg_price FROM products WHERE id = ANY($1) GROUP BY category",
        viewed_ids,
    )
    if not profile_rows:
        return {"products": [], "type": "empty"}

    # Extract brands (first word of product name)
    brand_rows = await pool.fetch(
        "SELECT lower(split_part(name, ' ', 1)) as brand FROM products WHERE id = ANY($1)",
        viewed_ids,
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
    products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]
    return {"products": products, "type": "personalized"}


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


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
