"""Joriy foydalanuvchi: profil, sevimlilar, kuzatuv ro'yxati va Telegram."""

from __future__ import annotations

import asyncpg
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from auth_deps import _require_user, _user_payload
from auth_models import UpdateProfileRequest

router = APIRouter()


@router.get("/api/users/me")
async def get_me(row: asyncpg.Record = Depends(_require_user)) -> dict:
    return _user_payload(row)


@router.patch("/api/users/me/profile")
async def update_profile(
    request: Request,
    body: UpdateProfileRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        """
        INSERT INTO user_profiles
            (user_id, age_group, budget_level, preferred_brands, preferred_categories)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
            age_group            = EXCLUDED.age_group,
            budget_level         = EXCLUDED.budget_level,
            preferred_brands     = EXCLUDED.preferred_brands,
            preferred_categories = EXCLUDED.preferred_categories,
            updated_at           = NOW()
        """,
        row["id"],
        body.age_group,
        body.budget_level,
        body.preferred_brands,
        body.preferred_categories,
    )
    return {"ok": True}


# ── User Favorites ────────────────────────────────────────────────────────────

class UserListItemRequest(BaseModel):
    product: dict


@router.get("/api/users/me/favorites")
async def get_favorites(request: Request, row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    rows = await pool.fetch(
        "SELECT product_data FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC",
        row["id"],
    )
    return {"items": [r["product_data"] for r in rows]}


@router.post("/api/users/me/favorites/{product_id}", status_code=201)
async def add_favorite(
    request: Request,
    product_id: str,
    body: UserListItemRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        """
        INSERT INTO user_favorites (user_id, product_id, product_data)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET product_data = EXCLUDED.product_data
        """,
        row["id"], product_id, body.product,
    )
    return {"ok": True}


@router.delete("/api/users/me/favorites/{product_id}")
async def remove_favorite(
    request: Request,
    product_id: str,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        "DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2",
        row["id"], product_id,
    )
    return {"ok": True}


# ── User Watchlist ─────────────────────────────────────────────────────────────

@router.get("/api/users/me/watchlist")
async def get_watchlist(request: Request, row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    async with pool.acquire() as conn:
        watch_rows = await conn.fetch(
            """
            SELECT w.product_id, w.product_data, p.price AS current_price
            FROM user_watchlist w
            LEFT JOIN products p ON p.id = w.product_id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
            """,
            row["id"],
        )
        if not watch_rows:
            return {"items": []}
        product_ids = [r["product_id"] for r in watch_rows]
        market_rows = await conn.fetch(
            """
            SELECT product_id, source, price, url
            FROM product_markets
            WHERE product_id = ANY($1)
            ORDER BY price
            """,
            product_ids,
        )

    markets_by_product: dict[str, list] = {}
    for m in market_rows:
        pid = m["product_id"]
        markets_by_product.setdefault(pid, []).append({
            "source": m["source"],
            "price": float(m["price"]),
            "url": m["url"] or "#",
        })

    items = []
    for r in watch_rows:
        item = dict(r["product_data"])
        pid = r["product_id"]
        if r["current_price"] is not None:
            item["current_price"] = float(r["current_price"])
        if pid in markets_by_product:
            item["current_markets"] = markets_by_product[pid]
        items.append(item)

    return {"items": items}


@router.post("/api/users/me/watchlist/{product_id}", status_code=201)
async def add_watchlist(
    request: Request,
    product_id: str,
    body: UserListItemRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        """
        INSERT INTO user_watchlist (user_id, product_id, product_data)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET product_data = EXCLUDED.product_data
        """,
        row["id"], product_id, body.product,
    )
    return {"ok": True}


@router.delete("/api/users/me/watchlist/{product_id}")
async def remove_watchlist(
    request: Request,
    product_id: str,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        "DELETE FROM user_watchlist WHERE user_id = $1 AND product_id = $2",
        row["id"], product_id,
    )
    return {"ok": True}


# ── Telegram integration ───────────────────────────────────────────────────────

class TelegramLinkRequest(BaseModel):
    chat_id: int


@router.get("/api/users/me/telegram")
async def get_telegram_status(request: Request, row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    chat_id = await pool.fetchval(
        "SELECT telegram_chat_id FROM user_profiles WHERE user_id = $1", row["id"]
    )
    return {"linked": chat_id is not None, "chat_id": chat_id}


@router.post("/api/users/me/telegram")
async def link_telegram(
    request: Request,
    body: TelegramLinkRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        """
        INSERT INTO user_profiles (user_id, telegram_chat_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE SET telegram_chat_id = EXCLUDED.telegram_chat_id
        """,
        row["id"], body.chat_id,
    )
    return {"ok": True}


@router.delete("/api/users/me/telegram")
async def unlink_telegram(request: Request, row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    await pool.execute(
        "UPDATE user_profiles SET telegram_chat_id = NULL WHERE user_id = $1", row["id"]
    )
    return {"ok": True}
