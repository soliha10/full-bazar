"""Parol, JWT va joriy foydalanuvchi — auth va users yo'llari uchun umumiy."""

from __future__ import annotations

import time
import uuid
from collections import deque
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import asyncpg
import bcrypt
import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app_config import _JWT_ALGO, _JWT_EXPIRE_DAYS, _JWT_SECRET

_bearer = HTTPBearer(auto_error=False)


def _hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def _verify_pw(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def _make_token(user_id: str) -> str:
    exp = datetime.now(tz=timezone.utc) + timedelta(days=_JWT_EXPIRE_DAYS)
    return pyjwt.encode({"sub": user_id, "exp": exp}, _JWT_SECRET, algorithm=_JWT_ALGO)


async def _require_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> asyncpg.Record:
    """FastAPI dependency — decodes JWT and fetches the user row."""
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, _JWT_SECRET, algorithms=[_JWT_ALGO])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    pool: asyncpg.Pool = request.app.state.pool
    row = await pool.fetchrow(
        """
        SELECT u.id, u.name, u.email, u.phone,
               COALESCE(p.age_group,            '25-34') AS age_group,
               COALESCE(p.budget_level,          'mid')   AS budget_level,
               COALESCE(p.preferred_brands,      '{}')    AS preferred_brands,
               COALESCE(p.preferred_categories,  '{}')    AS preferred_categories
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1
        """,
        uuid.UUID(user_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return row


async def _optional_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[asyncpg.Record]:
    """Like _require_user, but returns None instead of raising when not authenticated."""
    if creds is None:
        return None
    try:
        return await _require_user(request, creds)
    except HTTPException:
        return None


def _auth_error(status_code: int, code: str, message: str, **extra: Any) -> HTTPException:
    """Auth xatolari: `code` — frontend tarjimasi uchun, `message` — zaxira matn."""
    return HTTPException(status_code=status_code, detail={"code": code, "message": message, **extra})


# ── Kirishni taxmin qilib buzishdan himoya ────────────────────────────────────
# IP bo'yicha cheklov (_AUTH_RATE_LIMIT) bitta hisobga ko'p IP dan
# urinishni to'xtatmaydi. Shuning uchun email bo'yicha ham: 15 daqiqada 5 ta
# noto'g'ri parol — hisob shu vaqtga yopiladi. API bitta jarayonda ishlaydi
# (Dockerfile: bitta uvicorn), xotiradagi hisoblagich yetarli.
_LOGIN_FAIL_LIMIT = 5
_LOGIN_FAIL_WINDOW = 15 * 60
_login_failures: dict[str, deque] = {}


def _login_retry_after(email: str) -> int:
    q = _login_failures.get(email)
    if not q:
        return 0
    now = time.monotonic()
    while q and q[0] <= now - _LOGIN_FAIL_WINDOW:
        q.popleft()
    if not q:
        _login_failures.pop(email, None)
        return 0
    if len(q) < _LOGIN_FAIL_LIMIT:
        return 0
    return max(1, int(q[0] + _LOGIN_FAIL_WINDOW - now))


def _record_login_failure(email: str) -> None:
    if len(_login_failures) > 50_000:  # xotira cheksiz o'smasin
        _login_failures.clear()
    _login_failures.setdefault(email, deque()).append(time.monotonic())


# Topilmagan email uchun ham bcrypt tekshiruvi o'tkaziladi: aks holda javob
# vaqti (≈0 ms va ≈250 ms) qaysi email ro'yxatdan o'tganini sezdirib qo'yardi.
_DUMMY_PW_HASH = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt(rounds=12)).decode()


def _user_payload(row: asyncpg.Record, extra: dict | None = None) -> dict:
    """Shape the user object the frontend expects."""
    profile_src = extra or row
    return {
        "id":    str(row["id"]),
        "name":  row["name"],
        "email": row["email"],
        "phone": row.get("phone"),
        "profile": {
            "name":                 row["name"],
            "email":                row["email"],
            "ageGroup":             profile_src.get("age_group",            "25-34"),
            "budgetLevel":          profile_src.get("budget_level",          "mid"),
            "preferredBrands":      list(profile_src.get("preferred_brands",      [])),
            "preferredCategories":  list(profile_src.get("preferred_categories",  [])),
        },
    }
