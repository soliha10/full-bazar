"""
Elasticsearch bilan ishlash (REST, httpx orqali — alohida klient kutubxonasi shart emas).

Indeks bazadagi `products` jadvalidan quriladi va `products` aliasi orqali
o'qiladi. Qayta qurish uzilishsiz: yangi indeks to'ldiriladi, alias unga
o'tkaziladi, eskisi o'chiriladi. ES ishlamasa (ELASTICSEARCH_URL bo'sh yoki
javob bermasa) barcha funksiyalar None qaytaradi — chaqiruvchi Postgres
qidiruviga o'tadi, sayt to'xtamaydi.
"""
from __future__ import annotations

import asyncio
import json
import os
import time

import httpx

from search_text import INDEX_ALIAS, build_query, index_body, product_doc

ES_URL = os.getenv("ELASTICSEARCH_URL", "").rstrip("/")
REFRESH_EVERY = int(os.getenv("SEARCH_REFRESH_SECONDS", "300"))
_TIMEOUT = httpx.Timeout(3.0, connect=1.5)

# Katalog "imzosi": o'zgarsa indeks qayta quriladi
_SIGNATURE_SQL = "SELECT md5(string_agg(id || '|' || name, ',' ORDER BY id)) FROM products"
_ROWS_SQL = """
    SELECT p.id, p.name, p.title, p.keywords,
           (SELECT COUNT(*) FROM product_markets pm WHERE pm.product_id = p.id) AS stores
    FROM products p
"""

_state = {"ready": False, "signature": None, "down_until": 0.0}


def enabled() -> bool:
    return bool(ES_URL) and time.time() >= _state["down_until"]


def _mark_down() -> None:
    # Bir daqiqa ES ga urinmaymiz — har so'rov 1.5 s ulanish kutmasin
    _state["ready"] = False
    _state["down_until"] = time.time() + 60


async def _req(http: httpx.AsyncClient, method: str, path: str, **kw) -> httpx.Response:
    return await http.request(method, f"{ES_URL}{path}", timeout=kw.pop("timeout", _TIMEOUT), **kw)


async def reindex(http: httpx.AsyncClient, pool) -> int:
    """Indeksni bazadan qaytadan quradi; hujjatlar sonini qaytaradi."""
    rows = await pool.fetch(_ROWS_SQL)
    name = f"{INDEX_ALIAS}-{int(time.time())}"
    r = await _req(http, "PUT", f"/{name}", json=index_body())
    r.raise_for_status()
    lines: list[str] = []
    for row in rows:
        lines.append(json.dumps({"index": {"_index": name, "_id": row["id"]}}))
        lines.append(json.dumps(product_doc(dict(row)), ensure_ascii=False))
    r = await _req(http, "POST", "/_bulk?refresh=true", content="\n".join(lines) + "\n",
                   headers={"Content-Type": "application/x-ndjson"}, timeout=60)
    r.raise_for_status()
    if r.json().get("errors"):
        raise RuntimeError("bulk indekslashda xato")

    # Aliasni yangi indeksga o'tkazish va eskilarini o'chirish — bitta amalda
    old = await _req(http, "GET", f"/_alias/{INDEX_ALIAS}")
    old_names = list(old.json().keys()) if old.status_code == 200 else []
    actions = [{"add": {"index": name, "alias": INDEX_ALIAS}}]
    actions += [{"remove_index": {"index": n}} for n in old_names]
    r = await _req(http, "POST", "/_aliases", json={"actions": actions})
    r.raise_for_status()
    _state["ready"] = True
    return len(rows)


async def search_ids(http: httpx.AsyncClient, q: str, size: int = 2000) -> list[str] | None:
    """Mos mahsulot ID lari muvofiqlik tartibida; ES ishlamasa None."""
    if not enabled() or not _state["ready"]:
        return None
    try:
        r = await _req(http, "POST", f"/{INDEX_ALIAS}/_search", json=build_query(q, size))
        r.raise_for_status()
    except (httpx.HTTPError, ValueError):
        _mark_down()
        return None
    return [hit["_id"] for hit in r.json()["hits"]["hits"]]


async def keep_index_fresh(app) -> None:
    """Fon vazifasi: indeks yo'q bo'lsa quradi, katalog o'zgarsa qayta quradi."""
    if not ES_URL:
        print("[search] ELASTICSEARCH_URL berilmagan — Postgres qidiruvi", flush=True)
        return
    while True:
        pool = app.state.pool
        if pool is not None:
            try:
                signature = await pool.fetchval(_SIGNATURE_SQL)
                if signature != _state["signature"] or not _state["ready"]:
                    count = await reindex(app.state.http, pool)
                    _state["signature"] = signature
                    _state["down_until"] = 0.0
                    print(f"[search] indeks yangilandi: {count} ta mahsulot", flush=True)
            except Exception as exc:  # ES hali ko'tarilmagan yoki tarmoq xatosi
                _mark_down()
                print(f"[search] ES bilan ishlab bo'lmadi: {type(exc).__name__}: {exc}", flush=True)
        await asyncio.sleep(REFRESH_EVERY if _state["ready"] else 30)
