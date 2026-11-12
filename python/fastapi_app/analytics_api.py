"""Do'konlar, brendlar, xususiyat filtrlari va analitika yo'llari."""

from __future__ import annotations

import asyncio
from collections import Counter

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request, Response

import brands
from market_logos import market_domains, market_logo
from catalog import _BATTERY_FACETS, _RAM_FACETS, _STORAGE_FACETS, _get_spec_index, _norm_mem
from resp_cache import _cache_get, _cache_put

router = APIRouter()


# ── Other endpoints ───────────────────────────────────────────────────────────

@router.get("/api/markets")
async def get_markets(request: Request, response: Response) -> dict:
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get("markets", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(
        "SELECT lower(source) AS key, source AS name, COUNT(*) AS count FROM product_markets GROUP BY source ORDER BY count DESC"
    )
    domains = await market_domains(pool)
    return _cache_put("markets", {
        "markets": [{
            "key": r["key"], "name": r["name"], "count": r["count"],
            "domain": domains.get(r["key"]),
            "logo": f"/api/markets/{r['key']}/logo" if domains.get(r["key"]) else None,
        } for r in rows]
    })


@router.get("/api/markets/{key}/logo")
async def get_market_logo(key: str, request: Request) -> Response:
    """Do'kon logotipi — domeni bazadagi e'lonlaridan, rasmi do'kon saytidan."""
    domains = _cache_get("market-domains", 3600)
    if domains is None:
        domains = _cache_put("market-domains", await market_domains(request.app.state.pool))
    domain = domains.get(key.lower())
    if not domain:
        raise HTTPException(status_code=404, detail="Unknown market")
    img = await market_logo(request.app.state.http, key.lower(), domain)
    if not img:
        raise HTTPException(status_code=404, detail="Logo not found")
    return Response(content=img[0], media_type=img[1],
                    headers={"Cache-Control": "public, max-age=604800"})


@router.get("/api/brands")
async def get_brands(request: Request, response: Response) -> dict:
    """
    Bazada haqiqatda mahsuloti bor brendlar va ularning soni.

    Filtr ro'yxati ilgari mijozda qo'lda yozilgan edi va bazada bir dona ham
    mahsuloti yo'q brendlarni ham ko'rsatardi — bosgan odam bo'sh sahifaga
    tushib, "topilmayapti" degan xulosaga kelardi. Endi ro'yxat bazadan
    keladi: mahsuloti yo'q brend o'z-o'zidan ko'rinmaydi.
    """
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get("brands", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch("SELECT name, keywords FROM products")

    counts: Counter[str] = Counter()
    for r in rows:
        brand = brands.extract_brand(f"{r['name'] or ''} {r['keywords'] or ''}")
        if brand:
            counts[brand] += 1

    # Ko'rsatiladigan nom: "poco" -> "Poco", "zte" -> "ZTE"
    special = {"zte": "ZTE", "lg": "LG", "tcl": "TCL", "oneplus": "OnePlus"}
    return _cache_put("brands", {
        "brands": [
            {"key": key, "name": special.get(key, key.capitalize()), "count": count}
            for key, count in counts.most_common()
        ]
    })


@router.get("/api/spec-facets")
async def spec_facets(request: Request, response: Response) -> dict:
    """Xususiyat filtrlari uchun mavjud qiymatlar.

    Har bir qiymat yonida nechta MAHSULOT mos kelishi ko'rsatiladi, shunda UI
    hech qanday natija bermaydigan filtrni taklif qilmaydi. Mahsulot↔xususiyat
    moslash _get_spec_index da 5 daqiqa keshlanadi.
    """
    response.headers["Cache-Control"] = "public, max-age=3600"

    # Hisoblar saytdagi MAHSULOTLAR bo'yicha (GSMArena modellari emas) va
    # faqat standart qiymatlar: ilgari ro'yxatda tugmali telefonlardan kelgan
    # "1MB", "45MB" kabi o'nlab qiymat, "1TB" va "1024GB" esa alohida turardi.
    ram_counts: Counter = Counter()
    storage_counts: Counter = Counter()
    battery_counts: Counter = Counter()

    spec_index = await _get_spec_index(request.app.state.pool)
    for row in spec_index.values():
        for o in {_norm_mem(o) for o in (row["ram_options"] or [])}:
            if o in _RAM_FACETS:
                ram_counts[o] += 1
        for o in {_norm_mem(o) for o in (row["storage_options"] or [])}:
            if o in _STORAGE_FACETS:
                storage_counts[o] += 1
        for b in _BATTERY_FACETS:
            if (row["battery_mah"] or 0) >= b:
                battery_counts[b] += 1

    return {
        "ram":     [{"value": v, "count": ram_counts[v]} for v in _RAM_FACETS if ram_counts[v]],
        "storage": [{"value": v, "count": storage_counts[v]} for v in _STORAGE_FACETS if storage_counts[v]],
        "battery": [{"min": b, "count": battery_counts[b]} for b in _BATTERY_FACETS if battery_counts[b]],
    }


@router.get("/api/search-trends")
async def search_trends(request: Request, days: int = Query(7, ge=1, le=30), limit: int = Query(15, ge=1, le=50)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(
        """
        SELECT
            search_query,
            COUNT(*)                   AS total,
            COUNT(DISTINCT session_id) AS unique_sessions
        FROM user_events
        WHERE event_type = 'search'
          AND search_query IS NOT NULL
          AND search_query <> ''
          -- ($2 || ' days')::INTERVAL emas: bunda Postgres $2 ni matn deb
          -- hisoblaydi, endpoint esa butun son yuboradi va asyncpg xato beradi
          -- ("invalid input for query argument $2: 7 (expected str, got int)").
          AND created_at > NOW() - make_interval(days => $2)
        GROUP BY search_query
        ORDER BY total DESC
        LIMIT $1
        """,
        limit, days,
    )
    return {
        "days": days,
        "trends": [
            {"query": r["search_query"], "count": int(r["total"]), "uniqueSessions": int(r["unique_sessions"])}
            for r in rows
        ],
    }


@router.get("/api/market-analytics")
async def market_analytics(request: Request, response: Response) -> dict:
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get("market-analytics", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
    # Uchala so'rov bir-biriga bog'liq emas — ketma-ket emas, barobar yuboriladi.
    market_rows, popular_rows, total_events = await asyncio.gather(
        pool.fetch(
            """
        SELECT
            pm.source,
            COUNT(DISTINCT pm.product_id)          AS product_count,
            ROUND(AVG(pm.price)::numeric, 0)        AS avg_price,
            ROUND(MIN(pm.price)::numeric, 0)        AS min_price,
            ROUND(MAX(pm.price)::numeric, 0)        AS max_price
        FROM product_markets pm
        GROUP BY pm.source
        ORDER BY product_count DESC
        """
        ),
        pool.fetch(
            """
        SELECT
            ue.product_id,
            p.name,
            p.price,
            p.image,
            COUNT(*) AS view_count
        FROM user_events ue
        JOIN products p ON p.id = ue.product_id
        WHERE ue.event_type = 'view'
          AND ue.product_id IS NOT NULL
          AND ue.created_at > NOW() - INTERVAL '7 days'
        GROUP BY ue.product_id, p.name, p.price, p.image
        ORDER BY view_count DESC
        LIMIT 8
        """
        ),
        pool.fetchval(
            "SELECT COUNT(*) FROM user_events WHERE created_at > NOW() - INTERVAL '7 days'"
        ),
    )
    return _cache_put("market-analytics", {
        "markets": [
            {
                "source": r["source"],
                "productCount": int(r["product_count"]),
                "avgPrice": float(r["avg_price"] or 0),
                "minPrice": float(r["min_price"] or 0),
                "maxPrice": float(r["max_price"] or 0),
            }
            for r in market_rows
        ],
        "popularProducts": [
            {
                "id": r["product_id"],
                "name": r["name"],
                "price": float(r["price"] or 0),
                "image": r["image"],
                "viewCount": int(r["view_count"]),
            }
            for r in popular_rows
        ],
        "weeklyEvents": int(total_events or 0),
    })
