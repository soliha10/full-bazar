"""Ro'yxatdan o'tishda tasdiqlash kodlari: kanallar, kod yuborish va tekshirish."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import asyncpg
import jwt as pyjwt
from fastapi import APIRouter, HTTPException, Request
from jwt.exceptions import InvalidTokenError

import otp
from app_config import _JWT_ALGO, _JWT_SECRET
from auth_deps import _auth_error
from auth_models import SendCodeRequest, VerifyCodeRequest

router = APIRouter()


# ── Auth endpoints ────────────────────────────────────────────────────────────

_TAKEN = {
    "email": ("email_taken", "Bu email allaqachon ro'yxatdan o'tgan"),
    "phone": ("phone_taken", "Bu telefon raqam allaqachon ro'yxatdan o'tgan"),
}
_VERIFY_TOKEN_MINUTES = 30


def _channel_enabled(channel: str) -> bool:
    return otp.email_enabled() if channel == "email" else otp.sms_enabled()


async def _target_taken(pool: asyncpg.Pool, channel: str, target: str) -> bool:
    sql = ("SELECT 1 FROM users WHERE lower(email) = $1" if channel == "email"
           else "SELECT 1 FROM users WHERE phone = $1")
    return await pool.fetchval(sql, target) is not None


def _taken_error(channel: str) -> HTTPException:
    code, msg = _TAKEN[channel]
    return _auth_error(409, code, msg, field=channel)


def _make_verification_token(channel: str, target: str) -> str:
    exp = datetime.now(tz=timezone.utc) + timedelta(minutes=_VERIFY_TOKEN_MINUTES)
    return pyjwt.encode(
        {"typ": "verify", "purpose": "register", "ch": channel, "tgt": target, "exp": exp},
        _JWT_SECRET, algorithm=_JWT_ALGO,
    )


def _verification_token_ok(token: str | None, channel: str, target: str) -> bool:
    if not token:
        return False
    try:
        data = pyjwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGO])
    except InvalidTokenError:
        return False
    return (data.get("typ") == "verify" and data.get("purpose") == "register"
            and data.get("ch") == channel and data.get("tgt") == target)


@router.get("/api/auth/channels")
async def auth_channels() -> dict:
    """Qaysi kanal orqali kod yuborish mumkin — frontend shunga qarab
    telefon variantini ko'rsatadi va kod bosqichini qo'shadi."""
    return {"email": otp.email_enabled(), "phone": otp.sms_enabled()}


@router.post("/api/auth/send-code")
async def auth_send_code(request: Request, body: SendCodeRequest) -> dict:
    """Ro'yxatdan o'tish uchun 6 xonali kod yuboradi (email yoki SMS).

    Cheklovlar: bitta manzilga 60 soniyada 1 marta va soatiga 5 marta;
    ustiga IP bo'yicha _AUTH_RATE_LIMIT. Kod 10 daqiqa amal qiladi, yangisi
    yuborilganda eskisi bekor bo'ladi.
    """
    pool: asyncpg.Pool = request.app.state.pool
    if not _channel_enabled(body.channel):
        raise _auth_error(503, "channel_unavailable", "Bu kanal hozircha ishlamaydi")
    if await _target_taken(pool, body.channel, body.target):
        raise _taken_error(body.channel)

    stats = await pool.fetchrow(
        """
        SELECT MAX(created_at) AS last_at,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS last_hour
        FROM verification_codes WHERE target = $1 AND purpose = 'register'
        """,
        body.target,
    )
    now = datetime.now(tz=timezone.utc)
    if stats["last_at"] is not None:
        wait = otp.RESEND_COOLDOWN_SECONDS - int((now - stats["last_at"]).total_seconds())
        if wait > 0:
            raise _auth_error(429, "resend_cooldown", "Kodni qayta yuborishdan oldin kuting", retryAfter=wait)
    if stats["last_hour"] >= otp.MAX_SENDS_PER_HOUR:
        raise _auth_error(429, "too_many_codes", "Bu manzilga juda ko'p kod yuborildi", retryAfter=3600)

    code = otp.generate_code()
    try:
        if body.channel == "email":
            await otp.send_email_code(body.target, code, body.lang)
        else:
            await otp.send_sms_code(body.target, code)
    except otp.DeliveryError as exc:
        print(f"[otp] {body.channel} yuborilmadi: {exc}", flush=True)
        raise _auth_error(502, "delivery_failed", "Kodni yuborib bo'lmadi") from None

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Eski, ishlatilmagan kodlar bekor — faqat oxirgisi amal qiladi
            await conn.execute(
                "UPDATE verification_codes SET consumed_at = NOW() "
                "WHERE target = $1 AND purpose = 'register' AND consumed_at IS NULL",
                body.target,
            )
            await conn.execute(
                """
                INSERT INTO verification_codes (channel, target, purpose, code_hash, expires_at)
                VALUES ($1, $2, 'register', $3, NOW() + make_interval(secs => $4))
                """,
                body.channel, body.target, otp.hash_code(code, body.target, _JWT_SECRET),
                otp.CODE_TTL_SECONDS,
            )
            # Bir sutkadan eski yozuvlar kerak emas
            await conn.execute("DELETE FROM verification_codes WHERE created_at < NOW() - INTERVAL '1 day'")

    masked = otp.mask_email(body.target) if body.channel == "email" else otp.mask_phone(body.target)
    return {
        "sent": True,
        "maskedTarget": masked,
        "expiresIn": otp.CODE_TTL_SECONDS,
        "resendIn": otp.RESEND_COOLDOWN_SECONDS,
    }


@router.post("/api/auth/verify-code")
async def auth_verify_code(request: Request, body: VerifyCodeRequest) -> dict:
    """Kodni tekshiradi va 30 daqiqalik verification_token qaytaradi.

    Bitta kod uchun 5 ta urinish — undan keyin yangi kod so'rash kerak, aks
    holda 6 xonali kodni (10^6 variant) tanlab topish mumkin bo'lardi.
    """
    pool: asyncpg.Pool = request.app.state.pool
    row = await pool.fetchrow(
        """
        SELECT id, code_hash, attempts, expires_at FROM verification_codes
        WHERE target = $1 AND channel = $2 AND purpose = 'register' AND consumed_at IS NULL
        ORDER BY created_at DESC LIMIT 1
        """,
        body.target, body.channel,
    )
    if row is None or row["expires_at"] < datetime.now(tz=timezone.utc):
        raise _auth_error(400, "code_expired", "Kod muddati tugagan. Yangi kod so'rang")
    if row["attempts"] >= otp.MAX_VERIFY_ATTEMPTS:
        raise _auth_error(429, "code_attempts_exceeded", "Urinishlar tugadi. Yangi kod so'rang")

    if not otp.codes_match(body.code, body.target, _JWT_SECRET, row["code_hash"]):
        attempts = await pool.fetchval(
            "UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
            row["id"],
        )
        left = max(0, otp.MAX_VERIFY_ATTEMPTS - attempts)
        if left == 0:
            raise _auth_error(429, "code_attempts_exceeded", "Urinishlar tugadi. Yangi kod so'rang")
        raise _auth_error(400, "code_invalid", "Kod noto'g'ri", attemptsLeft=left, field="code")

    await pool.execute("UPDATE verification_codes SET consumed_at = NOW() WHERE id = $1", row["id"])
    return {"verificationToken": _make_verification_token(body.channel, body.target),
            "expiresIn": _VERIFY_TOKEN_MINUTES * 60}
