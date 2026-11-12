"""Baza hovuzi, fon vazifalari va ilovaning lifespan i."""

from __future__ import annotations

import asyncio
import json
import os
from contextlib import asynccontextmanager

import asyncpg
import httpx
from fastapi import FastAPI

from app_config import DATABASE_URL
from db_schema import _prepare_db
from ml_matcher import _load_matcher
from tracking import _flush_track, _track_flusher

# ── JSONB codec ───────────────────────────────────────────────────────────────

async def _setup_jsonb_codec(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )



KEEP_WARM_JOB = "keep-render-warm"


async def _schedule_keep_warm(pool: asyncpg.Pool) -> None:
    base = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
    if not base:
        return
    try:
        async with pool.acquire() as conn:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_cron")
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions")
            await conn.execute(
                "SELECT cron.schedule($1, '*/10 * * * *', $2)",
                KEEP_WARM_JOB,
                f"SELECT net.http_get('{base}/health')",
            )
        print(f"[keep-warm] pg_cron: {base}/health har 10 daqiqada", flush=True)
    except Exception as exc:  # cron bo'lmasa ham API ishlashi kerak
        print(f"[keep-warm] o'rnatilmadi: {exc}", flush=True)


# Supabase bo'g'ilib qolganda (2026-10-24: disk IO tugagan, pooler
# "auth_query secret check timed out") `create_pool` timeoutsiz edi va lifespan
# cheksiz kutardi — Render uyg'otgan instansiya hech qachon port ochmas, har
# so'rov 150+ s osilib turardi. Endi ilova bazasiz ham ishga tushadi: baza
# kelguncha /api so'rovlari darhol 503 oladi, ulanish fonda qayta uriniladi.
DB_CONNECT_TIMEOUT = 10      # s — bitta ulanish
DB_COMMAND_TIMEOUT = 30      # s — bitta so'rov; osilgan so'rov hovuzni yemasin
DB_STARTUP_WAIT = 15         # s — ishga tushishda bazani shuncha kutamiz
DB_RETRY_DELAY = 30          # s


async def _connect_db(app: FastAPI) -> None:
    """Hovuzni ochadi va tayyorlaydi; muvaffaqiyatsiz bo'lsa qayta urinadi."""
    while True:
        pool = None
        try:
            pool = await asyncpg.create_pool(
                DATABASE_URL, min_size=1, max_size=10, init=_setup_jsonb_codec,
                timeout=DB_CONNECT_TIMEOUT, command_timeout=DB_COMMAND_TIMEOUT,
            )
            await _prepare_db(pool)
        except Exception as exc:
            print(f"[db] ulanmadi: {type(exc).__name__}: {exc} — "
                  f"{DB_RETRY_DELAY}s dan keyin qayta urinish", flush=True)
            if pool is not None:
                pool.terminate()
            await asyncio.sleep(DB_RETRY_DELAY)
            continue
        app.state.pool = pool
        print("[db] ulanish tayyor", flush=True)
        await _schedule_keep_warm(pool)
        app.state.flusher = asyncio.create_task(_track_flusher(pool))
        return


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = None
    app.state.flusher = None
    _load_matcher()  # warm up model at startup
    # Rasm proksisi uchun bitta umumiy klient: har so'rovda yangi klient ochish
    # olxcdn bilan TCP+TLS ni har safar qaytadan o'rnatardi (~100-200 ms).
    app.state.http = httpx.AsyncClient(
        follow_redirects=True,
        timeout=10,
        limits=httpx.Limits(max_connections=50, max_keepalive_connections=20),
    )
    connector = asyncio.create_task(_connect_db(app))
    try:
        await asyncio.wait_for(asyncio.shield(connector), DB_STARTUP_WAIT)
    except asyncio.TimeoutError:
        print("[db] baza hali javob bermayapti — API bazasiz ishga tushdi", flush=True)
    yield
    connector.cancel()
    if app.state.flusher:
        app.state.flusher.cancel()
    await app.state.http.aclose()
    if app.state.pool is not None:
        await _flush_track(app.state.pool)
        await app.state.pool.close()
