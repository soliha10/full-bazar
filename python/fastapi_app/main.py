"""
FastAPI service — serves product data from PostgreSQL.
Mirrors the Node.js /api/products and /api/products/:id endpoints.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

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


app = FastAPI(title="Full-Bazar API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


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
                f"EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id AND lower(pm.source) = ANY(${i}))"
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
            (SELECT COUNT(DISTINCT source) FROM product_markets) AS total_markets,
            (SELECT json_agg(r) FROM (
                SELECT source, COUNT(*) AS count
                FROM product_markets GROUP BY source ORDER BY count DESC
            ) r) AS markets
        """
    )
    return {
        "total_products": row["total_products"],
        "last_sync": row["last_sync"].isoformat() if row["last_sync"] else None,
        "total_markets": row["total_markets"],
        "markets": row["markets"] or [],
    }
