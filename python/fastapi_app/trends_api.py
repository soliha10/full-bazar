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


TREND_DAYS = 7
# Bir haftada eng arzon narx 40% dan ko'p o'zgarishi deyarli har doim ma'lumot
# xatosi (noto'g'ri moslashtirilgan e'lon, aksessuar narxi): Tahlil sahifasida
# "+1360%" chiqardi. Bunday juftliklar ro'yxatga kirmaydi.
TREND_MAX_PCT = 0.40


@router.get("/api/trends")
async def get_trends(request: Request, response: Response, limit: int = Query(8, ge=1, le=20)) -> dict:
    """
    Narxi tushgan/ko'tarilgan modellar: mahsulotning ENG ARZON narxi hozir va
    7 kun oldin. Ilgari har do'kon o'zgarishi YIG'ILARDI (iPhone uchun "-31.9 mln"
    — bitta narx emas, o'nta do'kon farqi yig'indisi) va eskirgan e'lonlar
    ham solishtirilardi.
    """
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get(f"trends:{limit}", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(
        """
        WITH before AS (
            -- Har do'konning 7 kun oldingi oxirgi narxi (bir vaqtda bir nechta
            -- e'lon yozilgan bo'lsa — eng arzoni), faqat HOZIR sotuvdagilari
            SELECT DISTINCT ON (h.product_id, h.source) h.product_id, h.price
            FROM price_history h
            JOIN product_markets pm ON pm.product_id = h.product_id AND pm.source = h.source
            WHERE h.recorded_at <= NOW() - make_interval(days => $1)
            ORDER BY h.product_id, h.source, h.recorded_at DESC, h.price ASC
        ),
        then_min AS (SELECT product_id, MIN(price) AS old_price FROM before GROUP BY product_id),
        now_min  AS (SELECT product_id, MIN(price) AS current_price FROM product_markets GROUP BY product_id)
        SELECT p.*, n.current_price, t.old_price,
               n.current_price - t.old_price AS change,
               (n.current_price - t.old_price) / t.old_price * 100 AS pct
        FROM now_min n
        JOIN then_min t USING (product_id)
        JOIN products p ON p.id = n.product_id
        WHERE t.old_price > 0
          AND n.current_price <> t.old_price
          AND (ABS(n.current_price - t.old_price) / t.old_price)::float8 <= $2::float8
        """,
        TREND_DAYS, TREND_MAX_PCT,
    )
    # Foiz bo'yicha: mutlaq so'm bo'yicha saralansa ro'yxatni faqat qimmat
    # flagmanlar egallardi
    drops = sorted((r for r in rows if r["change"] < 0), key=lambda r: r["pct"])[:limit]
    rises = sorted((r for r in rows if r["change"] > 0), key=lambda r: -r["pct"])[:limit]
    markets_map = await _fetch_markets(pool, [r["id"] for r in drops + rises])

    def item(r) -> dict:
        return {
            **_row_to_product(r, markets_map.get(r["id"], [])),
            "oldPrice": float(r["old_price"]),
            "priceChange": round(float(r["change"]), 2),
            "pctChange": round(float(r["pct"]), 1),
        }

    return _cache_put(f"trends:{limit}", {
        "days": TREND_DAYS, "dropping": [item(r) for r in drops], "rising": [item(r) for r in rises],
    })


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
