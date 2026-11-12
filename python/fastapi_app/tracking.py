"""Foydalanuvchi hodisalari (/api/track): xotirada yig'ib, paket bilan yozish."""

from __future__ import annotations

import asyncio
from collections import deque
from typing import Optional

import asyncpg
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TrackEvent(BaseModel):
    session_id: str
    event_type: str  # 'view' | 'search' | 'cart_add'
    product_id: Optional[str] = None
    search_query: Optional[str] = None


# Har ko'rish/qidiruv hodisasi uchun alohida INSERT reklama oqimida ulanish
# hovuzini (10 ta) shu mayda yozuvlar bilan band qilib, mahsulot so'rovlarini
# navbatga qo'yardi. Endi hodisalar xotirada yig'ilib, har 5 soniyada bitta
# executemany bilan yoziladi. Baza ishlamay qolsa bufer cheksiz o'smaydi.
_TRACK_FLUSH_SECONDS = 5
_TRACK_BUFFER_MAX = 5000
_track_buf: deque[tuple] = deque(maxlen=_TRACK_BUFFER_MAX)


async def _flush_track(pool: asyncpg.Pool) -> None:
    if not _track_buf:
        return
    batch = list(_track_buf)
    _track_buf.clear()
    try:
        await pool.executemany(
            "INSERT INTO user_events (session_id, event_type, product_id, search_query) VALUES ($1, $2, $3, $4)",
            batch,
        )
    except Exception as exc:  # analitika yo'qolsa ham API ishlashda davom etadi
        print(f"[track] {len(batch)} ta hodisa yozilmadi: {exc}", flush=True)


async def _track_flusher(pool: asyncpg.Pool) -> None:
    while True:
        await asyncio.sleep(_TRACK_FLUSH_SECONDS)
        await _flush_track(pool)


@router.post("/api/track")
async def track_event(event: TrackEvent):
    _track_buf.append(
        (event.session_id, event.event_type, event.product_id, event.search_query)
    )
    return {"ok": True}
