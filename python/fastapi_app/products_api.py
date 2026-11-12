"""Mahsulotlar ro'yxati, bitta mahsulot va o'xshash mahsulotlar yo'llari."""

from __future__ import annotations

import re
from typing import Any, Literal

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request, Response

import brands
from catalog import _fetch_markets, _find_product, _row_to_product
from products_query import _query_products
import search_es
from resp_cache import _cached_json

router = APIRouter()


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("/api/products")
async def get_products(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=200),
    search: str = Query(""),
    market: str = Query(""),
    brand: str = Query(""),
    category: str = Query(""),
    ram: str = Query("", description="Vergul bilan: 8GB,12GB"),
    storage: str = Query("", description="Vergul bilan: 128GB,256GB"),
    battery_min: int = Query(0, ge=0, le=20000),
    min_price: int = Query(0, ge=0),
    max_price: int = Query(0, ge=0),
    min_rating: float = Query(0, ge=0, le=5),
    sort: Literal["relevance", "price_asc", "price_desc", "rating"] = Query("relevance"),
) -> Response:
    search = " ".join(search.lower().split())
    market = market.strip().lower()
    brand = brand.strip()
    category = category.strip()
    key = "products:" + "|".join(map(str, (
        page, limit, search, market, brand.lower(), category, ram, storage,
        battery_min, min_price, max_price, min_rating, sort,
    )))
    # Netlify CDN 5 daqiqa saqlaydi; bu yerda 1 daqiqa — sinxronizatsiyadan
    # keyin yangi narxlar tezroq ko'rinsin.

    async def produce() -> dict:
        # Qidiruv Elasticsearch da (imlo xatosi, kirill, chala so'z); ES ishlamasa
        # None — _query_products eski LIKE qidiruviga o'tadi
        ids = await search_es.search_ids(request.app.state.http, search) if search else None
        return await _query_products(
            request.app.state.pool, page, limit, search, market, brand, category, ram, storage,
            battery_min, min_price, max_price, min_rating, sort, search_ids=ids,
        )
    return await _cached_json(key, 60, produce)


@router.get("/api/products/{product_ref}")
async def get_product(request: Request, product_ref: str) -> Response:
    """`product_ref` — slug (kanonik) yoki ID (eski havolalar uchun)."""
    async def load() -> dict:
        pool: asyncpg.Pool = request.app.state.pool
        row = await _find_product(pool, product_ref)
        if row is None:
            raise HTTPException(status_code=404, detail="Not Found")
        markets_map = await _fetch_markets(pool, [row["id"]])
        return _row_to_product(row, markets_map.get(row["id"], []))

    return await _cached_json(f"product:{product_ref.strip()}", 120, load)


# ── O'xshash mahsulotlar ──────────────────────────────────────────────────────
# Ilgari mahsulot sahifasidagi "O'xshash mahsulotlar" aslida shaxsiy tavsiyalar
# edi — Samsung A55 tagida 39 mln lik iPhone chiqardi. Endi qoida aniq:
#   1) shu brend, narxi ±35%;  2) yetmasa — boshqa brendlar, narxi ±25%.
# Bir modelning boshqa rangi (nomi xotiragacha bir xil) ko'rsatilmaydi.

_MEMORY_RE = re.compile(r"\d+\s*/\s*\d+\s*(?:gb|tb|гб|тб)?|\d+\s*(?:gb|tb|гб|тб)", re.I)


def _model_key(name: str) -> frozenset[str]:
    """
    Model kaliti — nomning xotiragacha bo'lgan qismidagi so'zlar TO'PLAMI:
    "Samsung Galaxy A55 5G 8/128 GB Blue" -> {samsung, galaxy, a55, 5g, 8, 128}.

    To'plam, chunki do'konlar bir modelni turlicha yozadi: "Redmi Смартфон 13C"
    va "Redmi Смартфон Redmi 13C", "3/64 GB" va "3/64Gb". Kirill so'zlar
    (смартфон, ГБ) normalize() da tushib qoladi.
    """
    m = _MEMORY_RE.search(name or "")
    head = (name or "")[: m.end()] if m else (name or "")
    norm = re.sub(r"(\d)(gb|tb)\b", r"\1", brands.normalize(head))
    return frozenset(w for w in norm.split() if w not in ("gb", "tb"))


def _same_model(a: frozenset[str], b: frozenset[str]) -> bool:
    """Biri ikkinchisining ichida bo'lsa — bir model ("iPhone Duo 512" ⊂ "iPhone Duo 12/512")."""
    return bool(a) and bool(b) and (a <= b or b <= a)


async def _similar_candidates(
    pool: asyncpg.Pool, exclude_id: str, lo: float, hi: float, center: float,
    brand_kws: list[str] | None, not_brand_kws: list[str] | None, limit: int,
) -> list[asyncpg.Record]:
    params: list[Any] = [exclude_id, lo, hi, center]
    where = ["p.id <> $1", "b.lo BETWEEN $2 AND $3"]

    def brand_clause(kws: list[str]) -> str:
        parts = []
        for kw in kws:
            params.append(f"%{kw}%")
            i = len(params)
            parts.append(f"(lower(p.name) LIKE ${i} OR lower(coalesce(p.keywords, '')) LIKE ${i})")
        return "(" + " OR ".join(parts) + ")"

    if brand_kws:
        where.append(brand_clause(brand_kws))
    if not_brand_kws:
        where.append("NOT " + brand_clause(not_brand_kws))
    params.append(limit)
    return await pool.fetch(
        f"""
        WITH b AS (
            SELECT product_id, MIN(price) AS lo, COUNT(*) AS n
            FROM product_markets GROUP BY product_id
        )
        SELECT p.*, b.lo AS best_price, b.n AS market_count
        FROM products p JOIN b ON b.product_id = p.id
        WHERE {' AND '.join(where)}
        ORDER BY abs(b.lo - $4), b.n DESC
        LIMIT ${len(params)}
        """,
        *params,
    )


@router.get("/api/products/{product_ref}/similar")
async def get_similar_products(request: Request, product_ref: str, limit: int = Query(8, ge=1, le=20)) -> Response:
    async def load() -> dict:
        pool: asyncpg.Pool = request.app.state.pool
        row = await _find_product(pool, product_ref)
        if row is None:
            raise HTTPException(status_code=404, detail="Not Found")
        own = await pool.fetchval("SELECT MIN(price) FROM product_markets WHERE product_id = $1", row["id"])
        price = float(own or row["price"] or 0)
        if price <= 0:
            return {"products": [], "basePrice": None, "brand": None}

        brand = brands.extract_brand(f"{row['name'] or ''} {row['keywords'] or ''}")
        kws = brands.keywords_for(brand) if brand else []
        own_key = _model_key(row["name"])

        picked: list[asyncpg.Record] = []
        seen: list[frozenset[str]] = [own_key]

        def take(rows: list[asyncpg.Record]) -> None:
            for r in rows:
                key = _model_key(r["name"])
                if any(_same_model(key, k) for k in seen):
                    continue
                seen.append(key)
                picked.append(r)
                if len(picked) >= limit:
                    return

        # Ko'proq olinadi: rang variantlari tashlangach ham ro'yxat to'lsin
        if kws:
            take(await _similar_candidates(pool, row["id"], price * 0.65, price * 1.35, price, kws, None, limit * 5))
        if len(picked) < limit:
            take(await _similar_candidates(pool, row["id"], price * 0.75, price * 1.25, price, None, kws or None, limit * 5))

        markets_map = await _fetch_markets(pool, [r["id"] for r in picked])
        return {
            "basePrice": price,
            "brand": brand or None,
            "products": [
                {**_row_to_product(r, markets_map.get(r["id"], [])),
                 "sameBrand": bool(brand) and brands.extract_brand(f"{r['name'] or ''} {r['keywords'] or ''}") == brand}
                for r in picked
            ],
        }

    return await _cached_json(f"similar:{product_ref.strip()}:{limit}", 300, load)
