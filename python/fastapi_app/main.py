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
    limit: int = Query(12, ge=1, le=100),
    search: str = Query(""),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    offset = (page - 1) * limit
    search = search.strip()

    if search:
        tokens = search.lower().split()
        # Build a WHERE clause that requires every token to appear in
        # the concatenated name+keywords column (same logic as Node.js)
        conditions = " AND ".join(
            f"(lower(p.name) LIKE ${ i + 1 } OR lower(p.keywords) LIKE ${ i + 1 })"
            for i in range(len(tokens))
        )
        params = [f"%{t}%" for t in tokens]

        count_row = await pool.fetchrow(
            f"SELECT COUNT(*) FROM products p WHERE {conditions}",
            *params,
        )
        total: int = count_row[0]

        rows = await pool.fetch(
            f"""
            SELECT p.*
            FROM products p
            WHERE {conditions}
            ORDER BY p.name
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
            """,
            *params,
            limit,
            offset,
        )
    else:
        count_row = await pool.fetchrow("SELECT COUNT(*) FROM products")
        total = count_row[0]

        rows = await pool.fetch(
            "SELECT * FROM products ORDER BY name LIMIT $1 OFFSET $2",
            limit,
            offset,
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
