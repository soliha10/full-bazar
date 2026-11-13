"""Narx tarixi, narx trendlari va umumiy statistika yo'llari."""

from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Query, Request, Response

from catalog import _fetch_markets, _row_to_product
from resp_cache import _cache_get, _cache_put

router = APIRouter()


# ── Trend Analysis endpoints ──────────────────────────────────────────────────

@router.get("/api/products/{product_id}/price-history")
async def get_price_history(
    request: Request,
    product_id: str,
    days: int = Query(30, ge=1, le=365),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(
        """
        SELECT source, price, recorded_at
        FROM price_history
        WHERE product_id = $1
          AND recorded_at > NOW() - make_interval(days => $2)
        -- source, price: bir vaqtda yozilgan bir nechta e'lon (ranglar) har
        -- safar bir xil tartibda kelsin
        ORDER BY recorded_at ASC, source, price
        """,
        product_id, days,
    )
    history = [
        {
            "source": r["source"],
            "price": float(r["price"]),
            "date": r["recorded_at"].isoformat(),
        }
        for r in rows
    ]
    return {"product_id": product_id, "days": days, "history": history}


@router.get("/api/trends")
async def get_trends(request: Request, response: Response, limit: int = Query(8, ge=1, le=20)) -> dict:
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get(f"trends:{limit}", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool

    rows = await pool.fetch(
        """
        WITH latest AS (
            SELECT DISTINCT ON (product_id, source)
                product_id, source, price, recorded_at
            FROM price_history
            ORDER BY product_id, source, recorded_at DESC
        ),
        oldest AS (
            SELECT DISTINCT ON (product_id, source)
                product_id, source, price, recorded_at
            FROM price_history
            WHERE recorded_at < NOW() - INTERVAL '3 days'
            ORDER BY product_id, source, recorded_at ASC
        ),
        changes AS (
            SELECT
                l.product_id,
                l.price        AS current_price,
                o.price        AS old_price,
                l.price - o.price AS price_change,
                CASE WHEN o.price > 0
                     THEN ROUND((l.price - o.price) / o.price * 100, 1)
                     ELSE 0 END AS pct_change
            FROM latest l
            JOIN oldest o ON o.product_id = l.product_id AND o.source = l.source
        ),
        aggregated AS (
            SELECT product_id,
                   MIN(current_price) AS current_price,
                   SUM(price_change)  AS total_change,
                   AVG(pct_change)    AS avg_pct
            FROM changes
            GROUP BY product_id
        )
        SELECT p.*, a.current_price, a.total_change, a.avg_pct
        FROM aggregated a
        JOIN products p ON p.id = a.product_id
        -- Narxi umuman o'zgarmaganlar "qimmatlashdi" ro'yxatiga tushmasligi
        -- kerak: snapshot faqat narx o'zgarganda yoziladi, shuning uchun
        -- o'zgarishsiz juftliklar 0 berib, ro'yxatni ifloslantirardi.
        WHERE a.total_change <> 0
        ORDER BY ABS(a.total_change) DESC
        LIMIT $1
        """,
        limit,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)

    dropping, rising = [], []
    for r in rows:
        change = float(r["total_change"] or 0)
        pct = float(r["avg_pct"] or 0)
        item = {
            **_row_to_product(r, markets_map.get(r["id"], [])),
            "priceChange": round(change, 2),
            "pctChange": round(pct, 1),
        }
        if change < 0:
            dropping.append(item)
        else:
            rising.append(item)

    return _cache_put(f"trends:{limit}", {"dropping": dropping, "rising": rising})


@router.get("/api/stats")
async def get_stats(request: Request, response: Response) -> dict:
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get("stats", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
    # Uchta COUNT bitta so'rovda — uchta alohida borish o'rniga bitta.
    # Bosh sahifadagi barcha raqamlar shu yerdan: ilgari ular frontendda
    # qo'lda yozilgan edi ("19 ta do'kon", "500+") va bazaga mos kelmasdi.
    row = await pool.fetchrow(
        """
        WITH per_product AS (
            SELECT product_id, COUNT(*) AS n, MIN(price) AS lo, MAX(price) AS hi
            FROM product_markets GROUP BY product_id
        )
        SELECT (SELECT COUNT(*) FROM products)                        AS products,
               (SELECT COUNT(DISTINCT source) FROM product_markets)   AS markets,
               (SELECT COUNT(*) FROM product_markets)                 AS offers,
               (SELECT COUNT(*) FROM per_product WHERE n > 1)         AS comparable,
               (SELECT MAX(created_at) FROM product_markets)          AS last_updated,
               (SELECT COUNT(*) FROM price_history)                   AS snapshots,
               (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY (hi - lo) / hi)
                  FROM per_product WHERE n > 1 AND hi > 0)            AS median_gap
        """
    )
    return _cache_put("stats", {
        "products": row["products"],
        "markets": row["markets"],
        "offers": row["offers"],
        # Kamida ikki do'konda sotiladigan, ya'ni haqiqatan solishtirsa
        # bo'ladigan mahsulotlar
        "comparableProducts": row["comparable"],
        # Shu mahsulotlarda eng arzon va eng qimmat narx orasidagi farqning
        # medianasi (0..1) — "solishtirish qancha tejaydi" degan savolga javob
        "medianPriceGap": round(float(row["median_gap"] or 0), 4),
        "lastUpdated": row["last_updated"].isoformat() if row["last_updated"] else None,
        "priceSnapshots": row["snapshots"],
    })
