"""Bazadan yaratiladigan sitemap, mahsulot va brend sahifalarining SEO HTML i."""

from __future__ import annotations

import asyncio
import os

import asyncpg
import orjson
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse

import brands
import seo
import seo_brand
import seo_sitemap
import seo_ssr
from brand_stats import display_name
from products_query import _query_products
from products_api import get_product
from resp_cache import _cache_get, _cache_put

router = APIRouter()


# ── Sitemap ───────────────────────────────────────────────────────────────────
# Ilgari sitemap Netlify build paytida yaratilardi va har yangilanishda deploy
# kerak bo'lardi (2026-10 da Netlify kreditlari tugadi). Endi shu yerda,
# bazadan to'g'ridan-to'g'ri (seo_sitemap.py) — narxlar yangilanganda deploy kerak emas.
_SITEMAP_SQL = """
    SELECT p.id, p.slug, p.name, p.keywords, p.image,
           GREATEST(p.created_at, h.changed) AS lastmod
    FROM products p
    LEFT JOIN (
        SELECT product_id, MAX(recorded_at) AS changed FROM price_history GROUP BY product_id
    ) h ON h.product_id = p.id
    ORDER BY p.id
"""


@router.get("/sitemap.xml")
async def sitemap(request: Request) -> Response:
    xml = _cache_get("sitemap", 3600)
    if xml is None:
        pool: asyncpg.Pool = request.app.state.pool
        rows = await pool.fetch(_SITEMAP_SQL)
        xml = _cache_put("sitemap", seo_sitemap.sitemap_xml((dict(r) for r in rows), brands.extract_brand))
    return Response(
        content=xml,
        media_type="application/xml; charset=utf-8",
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ── Mahsulot sahifasi (SEO) ──────────────────────────────────────────────────
# VPS da Caddy /product/* ni shu yerga uzatadi: SPA ning index.html iga
# mahsulot meta teglari yoziladi (seo.py). Cloudflare/Netlify dagi
# frontend/functions/product/[[path]].ts ning o'rnini bosadi. API yoki baza
# javob bermasa sahifa o'zgarishsiz beriladi — SPA o'zi ma'lumotni yuklaydi.
FRONTEND_INDEX = os.getenv("FRONTEND_INDEX", "/srv/site/index.html")


def _spa_html(page: str, status_code: int = 200) -> HTMLResponse:
    return HTMLResponse(page, status_code=status_code,
                        headers={"Cache-Control": "public, max-age=0, must-revalidate"})


@router.get("/product/{product_param:path}", include_in_schema=False)
async def product_page(product_param: str, request: Request) -> Response:
    try:
        with open(FRONTEND_INDEX, encoding="utf-8") as f:
            page = f.read()
    except OSError:
        raise HTTPException(status_code=503, detail="Frontend topilmadi")

    ref = seo.product_ref(product_param.split("/")[0])
    if not ref or getattr(request.app.state, "pool", None) is None:
        return _spa_html(page)

    try:
        res = await asyncio.wait_for(get_product(request, ref), 3)
        product = orjson.loads(res.body)
    except HTTPException as exc:
        if exc.status_code == 404:
            # Mahsulot o'chirilgan — "soft 404" o'rniga haqiqiy 404
            return _spa_html(page, 404)
        return _spa_html(page)
    except Exception:
        return _spa_html(page)
    if not product.get("name"):
        return _spa_html(page)

    # Eski (/product/prod-xxx) yoki eskirgan slugli manzil → kanonik, 301
    canonical = seo.product_path(product)
    if request.url.path != canonical:
        target = canonical + (f"?{request.url.query}" if request.url.query else "")
        return RedirectResponse(target, status_code=301)

    # API javobidagi brend (catalog._row_to_product) — sahifadagi bilan bir xil
    key = product.get("brand") or brands.extract_brand(f"{product.get('name') or ''} {product.get('keywords') or ''}")
    brand = (key, display_name(key)) if key else None
    page = seo.inject_product_meta(page, product, canonical,
                                   brand_name=brand[1] if brand else None, brand_key=key or None)
    return _spa_html(seo_ssr.inject_root(page, seo_ssr.product_body(product, brand)))


# ── Brend sahifasi (SEO) ─────────────────────────────────────────────────────
# /brand/<kalit>: SPA da katalog shu brend bilan ochiladi; bu yerda HTML ga
# sarlavha, tavsif, JSON-LD (CollectionPage + ItemList) va ko'rinadigan
# ro'yxat yoziladi (seo_brand.py, seo_ssr.py). Noma'lum brend — haqiqiy 404.
BRAND_LIST_SIZE = 24


@router.get("/brand/{brand_key}", include_in_schema=False)
async def brand_page(brand_key: str, request: Request) -> Response:
    try:
        with open(FRONTEND_INDEX, encoding="utf-8") as f:
            page = f.read()
    except OSError:
        raise HTTPException(status_code=503, detail="Frontend topilmadi")

    key = brand_key.strip().lower()
    if key not in brands.CANONICAL_BRANDS:
        return _spa_html(page, 404)
    if key != brand_key:
        return RedirectResponse(f"/brand/{key}", status_code=301)
    pool = getattr(request.app.state, "pool", None)
    if pool is None:
        return _spa_html(page)

    cache_key = f"brandpage:{key}"
    data = _cache_get(cache_key, 300)
    if data is None:
        try:
            listing, cheapest = await asyncio.wait_for(asyncio.gather(
                _query_products(pool, 1, BRAND_LIST_SIZE, "", "", key, "", "", "", 0, 0, 0, 0, "relevance"),
                _query_products(pool, 1, 1, "", "", key, "", "", "", 0, 0, 0, 0, "price_asc"),
            ), 3)
        except Exception:
            return _spa_html(page)
        products = [{**p, "path": seo.product_path(p)} for p in listing.get("products", [])]
        low = (cheapest.get("products") or [{}])[0].get("price")
        data = _cache_put(cache_key, {
            "products": products, "total": int(listing.get("total") or len(products)),
            "min_price": float(low) if low else None,
        })
    if not data["total"]:
        return _spa_html(page, 404)

    name = display_name(key)
    # Do'konlar soni berilmaydi: bu yerda faqat 24 ta mahsulot bor, brend bo'yicha
    # to'liq son emas — noto'g'ri raqam yozilmasin
    page = seo_brand.inject_brand_meta(page, key, name, data["products"], data["total"],
                                       data["min_price"], 0)
    return _spa_html(seo_ssr.inject_root(page, seo_ssr.brand_body(
        name, data["products"], data["total"], data["min_price"])))
