"""Yozish paytidagi takliflar: /api/search/suggest."""

from __future__ import annotations

from fastapi import APIRouter, Query, Request, Response

import search_es
from analytics_api import get_brands
from catalog import _fetch_markets, _row_to_product
from resp_cache import _cache_get, _cache_put
from search_text import brand_hints

router = APIRouter()

SUGGEST_SIZE = 6


async def _like_ids(pool, q: str) -> list[str]:
    """ES ishlamasa: oddiy qidiruv, eng ko'p do'konda borlari oldin."""
    clauses, params = [], []
    for token in q.split():
        params.append(f"%{token}%")
        clauses.append(f"(lower(p.name) LIKE ${len(params)} OR lower(p.keywords) LIKE ${len(params)})")
    rows = await pool.fetch(
        f"""SELECT p.id FROM products p WHERE {' AND '.join(clauses)}
            ORDER BY (SELECT COUNT(*) FROM product_markets pm WHERE pm.product_id = p.id) DESC, p.price
            LIMIT {SUGGEST_SIZE}""",
        *params,
    )
    return [r["id"] for r in rows]


@router.get("/api/search/suggest")
async def suggest(request: Request, response: Response, q: str = Query("", max_length=100)) -> dict:
    q = " ".join(q.lower().split())
    response.headers["Cache-Control"] = "public, max-age=120"
    if len(q) < 2:
        return {"query": q, "products": [], "brands": [], "engine": None}
    cached = _cache_get(f"suggest:{q}", 120)
    if cached is not None:
        return cached

    pool = request.app.state.pool
    ids = await search_es.search_ids(request.app.state.http, q, SUGGEST_SIZE)
    engine = "elasticsearch"
    if ids is None:
        ids, engine = await _like_ids(pool, q), "postgres"

    products: list[dict] = []
    if ids:
        rows = {r["id"]: r for r in await pool.fetch("SELECT * FROM products WHERE id = ANY($1::text[])", ids)}
        markets = await _fetch_markets(pool, ids)
        for pid in ids:
            if pid in rows:
                p = _row_to_product(rows[pid], markets.get(pid, []))
                products.append({
                    "id": p["id"], "slug": p["slug"], "name": p["name"], "image": p["image"],
                    "price": p["price"], "stores": len(p["markets"]),
                })

    brand_list = (await get_brands(request, Response()))["brands"]
    return _cache_put(f"suggest:{q}", {
        "query": q, "products": products, "brands": brand_hints(q, brand_list), "engine": engine,
    })
