"""Ro'yxatdan o'tish, email bandligini tekshirish va kirish yo'llari."""

from __future__ import annotations

import asyncio

import asyncpg
from fastapi import APIRouter, Request

from auth_codes_api import _channel_enabled, _target_taken, _taken_error, _verification_token_ok
from auth_deps import (
    _DUMMY_PW_HASH, _auth_error, _hash_pw, _login_failures, _login_retry_after,
    _make_token, _record_login_failure, _user_payload, _verify_pw,
)
from auth_models import EmailCheckRequest, LoginRequest, RegisterRequest

router = APIRouter()


@router.post("/api/auth/register", status_code=201)
async def auth_register(request: Request, body: RegisterRequest) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    channel, target = body.channel, body.target

    # Kanal yoqilgan bo'lsa (kalit .env da) — tasdiqlanmagan manzil bilan
    # ro'yxatdan o'tib bo'lmaydi. Telefon kanali o'chiq bo'lsa, telefon bilan
    # umuman ro'yxatdan o'tib bo'lmaydi (raqamni tekshirishning boshqa yo'li yo'q).
    verification_required = _channel_enabled(channel) or channel == "phone"
    if verification_required and not _channel_enabled(channel):
        raise _auth_error(503, "channel_unavailable", "Bu kanal hozircha ishlamaydi")
    verified = _verification_token_ok(body.verification_token, channel, target)
    if verification_required and not verified:
        raise _auth_error(403, "verification_required", "Avval kodni tasdiqlang", field=channel)

    if await _target_taken(pool, channel, target):
        raise _taken_error(channel)

    loop = asyncio.get_running_loop()
    pw_hash = await loop.run_in_executor(None, _hash_pw, body.password)

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                user_row = await conn.fetchrow(
                    """
                    INSERT INTO users (name, email, phone, password_hash, email_verified_at, phone_verified_at)
                    VALUES ($1, $2, $3, $4,
                            CASE WHEN $5 THEN NOW() END, CASE WHEN $6 THEN NOW() END)
                    RETURNING id, name, email, phone
                    """,
                    body.name, body.email, body.phone, pw_hash,
                    verified and channel == "email", verified and channel == "phone",
                )
                await conn.execute(
                    """
                    INSERT INTO user_profiles
                        (user_id, age_group, budget_level, preferred_brands, preferred_categories)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    user_row["id"],
                    body.age_group,
                    body.budget_level,
                    body.preferred_brands,
                    body.preferred_categories,
                )
    except asyncpg.UniqueViolationError:
        raise _taken_error(channel) from None

    token = _make_token(str(user_row["id"]))
    return {
        "token": token,
        "user": _user_payload(user_row, {
            "age_group":            body.age_group,
            "budget_level":         body.budget_level,
            "preferred_brands":     body.preferred_brands,
            "preferred_categories": body.preferred_categories,
        }),
    }


@router.post("/api/auth/check-email")
async def auth_check_email(request: Request, body: EmailCheckRequest) -> dict:
    """Ro'yxatdan o'tishning 1-qadamida: email bandligini 2-qadamdan OLDIN aytish.

    Email kanali yoqilgan bo'lsa buni /api/auth/send-code o'zi qiladi; bu
    yo'l kanal o'chiq paytdagi oqim uchun. So'rovlar _AUTH_RATE_LIMIT bilan cheklangan.
    """
    pool: asyncpg.Pool = request.app.state.pool
    return {"available": not await _target_taken(pool, "email", body.email)}


@router.post("/api/auth/login")
async def auth_login(request: Request, body: LoginRequest) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    ident = body.identifier or ""

    retry_after = _login_retry_after(ident)
    if retry_after:
        raise _auth_error(
            429, "too_many_attempts",
            "Juda ko'p noto'g'ri urinish. Birozdan keyin qayta urinib ko'ring",
            retryAfter=retry_after,
        )

    where = "u.phone = $1" if body.is_phone else "lower(u.email) = $1"
    row = await pool.fetchrow(
        f"""
        SELECT u.id, u.name, u.email, u.phone, u.password_hash,
               COALESCE(p.age_group,            '25-34') AS age_group,
               COALESCE(p.budget_level,          'mid')   AS budget_level,
               COALESCE(p.preferred_brands,      '{{}}')  AS preferred_brands,
               COALESCE(p.preferred_categories,  '{{}}')  AS preferred_categories
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE {where}
        """,
        ident,
    )

    loop = asyncio.get_running_loop()
    pw_hash = row["password_hash"] if row is not None else _DUMMY_PW_HASH
    ok = await loop.run_in_executor(None, _verify_pw, body.password, pw_hash)
    if row is None or not ok:
        _record_login_failure(ident)
        raise _auth_error(401, "invalid_credentials", "Login yoki parol noto'g'ri")

    _login_failures.pop(ident, None)

    await pool.execute("UPDATE users SET last_login_at = NOW() WHERE id = $1", row["id"])

    token = _make_token(str(row["id"]))
    return {"token": token, "user": _user_payload(row)}
