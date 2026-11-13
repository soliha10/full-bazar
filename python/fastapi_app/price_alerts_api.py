"""Kuzatuv ro'yxati bo'yicha narx o'zgarishlari: saytga kirganda ko'rsatiladigan xabar."""

from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from auth_deps import _require_user
from price_alerts import price_alerts

router = APIRouter()

# Har kuzatilgan mahsulotning hozirgi eng arzon taklifi
_ROWS_SQL = """
    SELECT w.product_id, w.product_data, w.seen_price,
           m.price AS now_price, m.source AS now_source
    FROM user_watchlist w
    LEFT JOIN LATERAL (
        SELECT pm.price, pm.source FROM product_markets pm
        WHERE pm.product_id = w.product_id
        ORDER BY pm.price LIMIT 1
    ) m ON TRUE
    WHERE w.user_id = $1
"""


@router.get("/api/users/me/price-alerts")
async def get_price_alerts(request: Request, row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(_ROWS_SQL, row["id"])
    return {"watching": len(rows), "items": price_alerts(dict(r) for r in rows)}


class SeenRequest(BaseModel):
    # Bo'sh — barcha kuzatilganlar ko'rildi deb belgilanadi
    product_ids: Optional[list[str]] = None


@router.post("/api/users/me/price-alerts/seen")
async def mark_price_alerts_seen(
    request: Request,
    body: SeenRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    """Hozirgi eng arzon narx — foydalanuvchi ko'rgan narx: keyingi xabar shundan hisoblanadi."""
    pool: asyncpg.Pool = request.app.state.pool
    status = await pool.execute(
        """
        UPDATE user_watchlist w
        SET seen_price = (SELECT MIN(pm.price) FROM product_markets pm WHERE pm.product_id = w.product_id)
        WHERE w.user_id = $1
          AND ($2::text[] IS NULL OR w.product_id = ANY($2::text[]))
          AND EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = w.product_id)
        """,
        row["id"], body.product_ids,
    )
    return {"ok": True, "updated": int(status.split()[-1])}
