"""Fikr-mulohaza: bazaga yoziladi va Telegram ga yuboriladi."""

from __future__ import annotations

import os
from typing import Optional

import asyncpg
import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field, field_validator

from auth_deps import _optional_user

router = APIRouter()


# ── Feedback ──────────────────────────────────────────────────────────────────

_FEEDBACK_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
_FEEDBACK_CHAT_ID = os.getenv("FEEDBACK_CHAT_ID", "")


class FeedbackRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    rating:  Optional[int] = Field(None, ge=1, le=5)
    name:    Optional[str] = Field(None, max_length=100)
    email:   Optional[EmailStr] = None

    @field_validator("message", "name")
    @classmethod
    def strip_str(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


async def _send_feedback_to_telegram(text: str) -> None:
    if not _FEEDBACK_BOT_TOKEN or not _FEEDBACK_CHAT_ID:
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{_FEEDBACK_BOT_TOKEN}/sendMessage",
                json={"chat_id": _FEEDBACK_CHAT_ID, "text": text, "parse_mode": "Markdown"},
            )
    except Exception as e:
        print(f"Telegram feedback send failed: {e}")


@router.post("/api/feedback", status_code=201)
async def submit_feedback(
    request: Request,
    body: FeedbackRequest,
    user: Optional[asyncpg.Record] = Depends(_optional_user),
) -> dict:
    pool: asyncpg.Pool = request.app.state.pool

    name = (user["name"] if user else None) or body.name
    email = (user["email"] if user else None) or body.email

    await pool.execute(
        """
        INSERT INTO feedback (user_id, name, email, rating, message)
        VALUES ($1, $2, $3, $4, $5)
        """,
        user["id"] if user else None,
        name, email, body.rating, body.message,
    )

    stars = "⭐" * body.rating if body.rating else "—"
    lines = [
        "📝 *Yangi fikr-mulohaza*",
        f"Baho: {stars}",
        f"Ism: {name or '—'}",
        f"Email: {email or '—'}",
        "",
        body.message,
    ]
    await _send_feedback_to_telegram("\n".join(lines))

    return {"ok": True}
