"""Mahsulot/xususiyat yordamchilari: qatorni JSON ga, slug/ID bo'yicha qidirish, spec keshi."""

from __future__ import annotations

import re
from typing import Any

import asyncpg

import brands
from resp_cache import _cache_get, _cache_put, _single_flight

# _store_specs xususiyatlar ro'yxatini app.state ga ham yozadi. main.py ni
# import qilsak aylanma import bo'lardi, shuning uchun main.py app.state ni
# shu yerga bind_state() orqali ulaydi.
_app_state: Any = None


def bind_state(state: Any) -> None:
    global _app_state
    _app_state = state


# Brend jadvali va nom moslashtirish endi brands.py da — scraper ham,
# sync_specs.py ham AYNAN shu funksiyalarni chaqiradi, ya'ni bu yerda
# ko'rinadigan xususiyat sahifadagisi bilan bir xil bo'lishi kafolatlangan.
_match_spec_row = brands.match_spec_row


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_product(row: asyncpg.Record, markets: list[dict], with_variants: bool = False) -> dict[str, Any]:
    sorted_markets = sorted(markets, key=lambda m: m["price"])
    best = sorted_markets[0] if sorted_markets else {}
    product = {
        "id": row["id"],
        # Kanonik manzil bo'lagi. Sinxronizatsiya hali ishlamagan bo'lsa NULL
        # bo'lishi mumkin — bunda mijoz ID ga qaytadi.
        "slug": (row["slug"] if "slug" in row.keys() else None) or None,
        "name": row["name"],
        "title": row["title"],
        "category": row["category"],
        "rating": float(row["rating"]) if row["rating"] is not None else None,
        "reviews": row["reviews"],
        "image": row["image"] or "",
        "images": list(row["images"] or []),
        "inStock": row["in_stock"],
        "keywords": row["keywords"] or "",
        "source": best.get("source", row["source"] or ""),
        "price": float(best.get("price", row["price"] or 0)),
        "url": best.get("url", row["url"] or "#"),
        "markets": sorted_markets,
    }
    # Rang variantlari ({color, images, offers, price}, sync/variants.py) — faqat
    # mahsulot sahifasiga: katalogning 200 talik ro'yxatida har karta uchun
    # barcha ranglarning rasm va takliflari ortiqcha yuk
    if with_variants:
        product["variants"] = (row["variants"] if "variants" in row.keys() else None) or []
    return product


# ── Xususiyatlar keshi ───────────────────────────────────────────────────────
# GSMArena dan endi ~15 000 model keladi va ro'yxat haftada bir yangilanadi.
# Uni har so'rovda bazadan olish ham, ishga tushganda bir marta o'qib abadiy
# ushlab turish ham to'g'ri emas: birinchisi sekin, ikkinchisi yangilangan
# xususiyatlarni API qayta ishga tushmaguncha ko'rsatmaydi.
_SPEC_TTL = 900  # 15 daqiqa


def _store_specs(rows: list[dict]) -> tuple[list[dict], brands.SpecIndex]:
    payload = (rows, brands.build_spec_index(rows))
    if _app_state is not None:
        _app_state.spec_rows = rows
    return _cache_put("specs", payload)


async def _get_specs(pool: asyncpg.Pool) -> tuple[list[dict], brands.SpecIndex]:
    """(yozuvlar, indeks) — 15 daqiqada bir marta yangilanadi."""
    cached = _cache_get("specs", _SPEC_TTL)
    if cached is not None:
        return cached

    async def load():
        rows = await pool.fetch("SELECT * FROM product_specs")
        return _store_specs([dict(r) for r in rows])

    return await _single_flight("specs", load)


# Eski manzillar: /product/samsung-galaxy-s24-prod-8fc7e81f5ca9aeb6051c
_LEGACY_ID_RE = re.compile(r"(prod-[0-9a-f]{20})$", re.I)


async def _find_product(pool: asyncpg.Pool, ref: str) -> asyncpg.Record | None:
    """
    Mahsulotni slug yoki ID bo'yicha topadi.

    Manzillarda endi faqat nom turadi (/product/iphone-15-pro-256gb), lekin
    tashqarida tarqalgan eski havolalar ham ishlashi kerak: ular slug oxirida
    `-prod-<hex>` bilan kelardi, ba'zilari esa toza ID edi.
    """
    ref = (ref or "").strip()
    if not ref:
        return None

    row = await pool.fetchrow("SELECT * FROM products WHERE slug = $1", ref)
    if row is not None:
        return row

    row = await pool.fetchrow("SELECT * FROM products WHERE id = $1", ref)
    if row is not None:
        return row

    legacy = _LEGACY_ID_RE.search(ref)
    if legacy:
        row = await pool.fetchrow(
            "SELECT * FROM products WHERE id = $1", legacy.group(1).lower()
        )
        if row is not None:
            return row

    # Guruhlash o'zgargach eski mahsulot yangisiga qo'shilgan bo'lishi mumkin
    # (python/sync/aliases.py: _migrate_ids). Eski havola yangi mahsulotni ochadi, frontend esa
    # manzilni kanonik slugga almashtiradi.
    try:
        return await pool.fetchrow(
            """
            SELECT p.* FROM product_aliases a JOIN products p ON p.id = a.new_id
            WHERE a.old_id = $1 OR a.old_slug = $1 OR a.old_id = $2
            LIMIT 1
            """,
            ref, (legacy.group(1).lower() if legacy else ref),
        )
    except asyncpg.UndefinedTableError:
        # Jadval birinchi yangi sinxronizatsiyadan keyin paydo bo'ladi
        return None


async def _fetch_markets(pool: asyncpg.Pool, product_ids: list[str]) -> dict[str, list[dict]]:
    if not product_ids:
        return {}
    rows = await pool.fetch(
        "SELECT product_id, source, price, url, created_at FROM product_markets"
        " WHERE product_id = ANY($1) ORDER BY price",
        product_ids,
    )
    result: dict[str, list[dict]] = {pid: [] for pid in product_ids}
    for r in rows:
        result[r["product_id"]].append({
            "source": r["source"],
            "price": float(r["price"]),
            "url": r["url"] or "#",
            # Sinxronizatsiya product_markets ni har safar to'liq qayta yozadi,
            # shuning uchun created_at = narx oxirgi marta tekshirilgan payt.
            # Agregatorlarda bu ishonchning asosi: foydalanuvchi narx qanchalik
            # yangi ekanini ko'rmasa, ro'yxatga ishonmaydi.
            "checkedAt": r["created_at"].isoformat() if r["created_at"] else None,
        })
    return result


async def _get_spec_index(pool: asyncpg.Pool) -> dict[str, dict]:
    """{product_id: spec_row} — xususiyat bo'yicha filtrlash uchun.

    Mahsulot bilan xususiyat ustun orqali bog'lanmagan: bog'lanish nomdan
    _match_spec_row orqali hisoblanadi. Uni har so'rovda qayta hisoblamaslik
    uchun natijani 5 daqiqa saqlaymiz — mahsulotlar kuniga 4 marta yangilanadi,
    shuning uchun bu muddat xavfsiz.
    """
    cached = _cache_get("spec-index", 300)
    if cached is not None:
        return cached

    # Butun katalogni ~15 000 modelga moslashtirish CPU ni band qiladi —
    # kesh eskirgan paytda kelgan parallel filtr so'rovlari uni bir marta hisoblaydi.
    async def build():
        _, spec_index = await _get_specs(pool)
        rows = await pool.fetch("SELECT id, name, keywords FROM products")
        index: dict[str, dict] = {}
        for r in rows:
            spec = _match_spec_row(r["name"] or "", r["keywords"] or "", spec_index)
            if spec is not None:
                index[r["id"]] = spec
        return _cache_put("spec-index", index)

    return await _single_flight("spec-index", build)


# ── Xotira qiymatlari ─────────────────────────────────────────────────────────
_RAM_FACETS = ("2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "24GB")
_STORAGE_FACETS = ("32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB")
_BATTERY_FACETS = (4000, 5000, 6000, 7000)


def _norm_mem(label: str) -> str:
    """'8 gb' -> '8GB', '1024GB' -> '1TB' — filtr va facet bir xil kalitda."""
    m = re.match(r"\s*(\d+(?:\.\d+)?)\s*(mb|gb|tb)", (label or "").lower())
    if not m:
        return (label or "").strip().upper()
    num, unit = float(m.group(1)), m.group(2)
    if unit == "gb" and num >= 1024 and num % 1024 == 0:
        num, unit = num / 1024, "tb"
    return f"{num:g}{unit.upper()}"
