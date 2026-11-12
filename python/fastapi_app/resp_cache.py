"""Jarayon ichidagi kesh: agregat qiymatlar va tayyor JSON javoblar."""

from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from decimal import Decimal
from typing import Any

import orjson
from fastapi import Response

# ── Javob keshi ───────────────────────────────────────────────────────────────
# Bazaga har bir borish ~300 ms turadi (baza API bilan bir regionda emas), shuning
# uchun sinxronizatsiya orasida umuman o'zgarmaydigan agregat javoblarni jarayon
# ichida saqlaymiz. Kesh faqat o'qish endpointlari uchun — foydalanuvchiga xos
# ma'lumot (favorites, watchlist, personalized) hech qachon keshlanmaydi.

_cache_store: dict[str, tuple[float, Any]] = {}


def _cache_get(key: str, ttl: float) -> Any | None:
    hit = _cache_store.get(key)
    if hit is None or time.time() - hit[0] > ttl:
        return None
    return hit[1]


def _cache_put(key: str, value: Any) -> Any:
    _cache_store[key] = (time.time(), value)
    return value


# ── Javoblar keshi (tayyor JSON baytlari) ────────────────────────────────────
# Mahsulot ro'yxati va sahifasi eng ko'p so'raladigan yo'llar. Netlify CDN
# ularni keshlaydi, lekin har chekka tugun va har yangi URL baribir bir marta
# bu yerga keladi — reklama oqimida bu bir vaqtda o'nlab bir xil so'rov.
# Javobni tayyor baytlar ko'rinishida saqlaymiz: qayta so'rov bazaga ham,
# JSON kodlashga ham bormaydi. Kalitlar qidiruv matniga bog'liq bo'lgani
# uchun hajm cheklangan (eng eskisi chiqarib tashlanadi).
_RESP_CACHE_MAX = 2000
_resp_store: OrderedDict[str, tuple[float, bytes]] = OrderedDict()

# Bir xil kalit uchun hozir bajarilayotgan hisob-kitob. Kesh bo'sh paytda
# (masalan, Render uyg'ongandan keyin yoki sinxronizatsiyadan so'ng) bir
# vaqtda 50 ta bir xil so'rov kelsa, bazaga 50 marta emas, BIR marta boriladi,
# qolganlari o'sha natijani kutadi.
_inflight: dict[str, asyncio.Task] = {}


async def _single_flight(key: str, producer) -> Any:
    task = _inflight.get(key)
    if task is None:
        async def run():
            try:
                return await producer()
            finally:
                _inflight.pop(key, None)
        task = asyncio.ensure_future(run())
        _inflight[key] = task
    # shield: mijoz uzilib qolsa ham umumiy hisob-kitob boshqalar uchun davom etadi
    return await asyncio.shield(task)


def _json_default(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj)


def _json_response(body: bytes) -> Response:
    return Response(content=body, media_type="application/json")


async def _cached_json(key: str, ttl: float, producer) -> Response:
    """producer() -> dict; natija baytlar ko'rinishida `ttl` soniya saqlanadi."""
    hit = _resp_store.get(key)
    if hit is not None and time.time() - hit[0] <= ttl:
        return _json_response(hit[1])

    async def build() -> bytes:
        body = orjson.dumps(await producer(), default=_json_default)
        _resp_store[key] = (time.time(), body)
        _resp_store.move_to_end(key)
        while len(_resp_store) > _RESP_CACHE_MAX:
            _resp_store.popitem(last=False)
        return body

    return _json_response(await _single_flight(key, build))
