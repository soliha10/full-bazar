"""Tavsiyalar: eng katta narx farqi va sessiyaga asoslangan shaxsiy tavsiyalar."""

from __future__ import annotations

import asyncio
import math

import asyncpg
from fastapi import APIRouter, Query, Request, Response

from catalog import _fetch_markets, _row_to_product
from resp_cache import _cache_get, _cache_put

router = APIRouter()


# ── Recommendations ───────────────────────────────────────────────────────────

@router.get("/api/recommendations")
async def get_recommendations(request: Request, response: Response, limit: int = Query(4, ge=1, le=10)) -> dict:
    response.headers["Cache-Control"] = "public, max-age=300"
    cached = _cache_get(f"recs:{limit}", 300)
    if cached is not None:
        return cached

    pool: asyncpg.Pool = request.app.state.pool
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
    return _cache_put(f"recs:{limit}", {
        "products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]
    })


@router.get("/api/recommendations/personalized")
async def get_personalized_recommendations(
    request: Request,
    session_id: str = Query(...),
    limit: int = Query(8, ge=1, le=20),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool

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

    # Ikkalasi ham bir xil top_viewed ro'yxatiga tayanadi va bir-biriga bog'liq
    # emas — ketma-ket kutib o'tirmasdan barobar yuboriladi.
    profile_rows, brand_rows = await asyncio.gather(
        pool.fetch(
            "SELECT category, AVG(price) AS avg_price FROM products WHERE id = ANY($1) GROUP BY category",
            top_viewed,
        ),
        pool.fetch(
            "SELECT lower(split_part(name, ' ', 1)) AS brand FROM products WHERE id = ANY($1)",
            top_viewed,
        ),
    )
    if not profile_rows:
        return {"products": [], "type": "empty"}

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
