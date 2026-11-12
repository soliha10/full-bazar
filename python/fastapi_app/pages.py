"""Bazadan yaratiladigan sitemap va mahsulot sahifasining SEO HTML i."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

import asyncpg
import orjson
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse

import seo
from products_api import get_product
from resp_cache import _cache_get, _cache_put

router = APIRouter()


# ── Sitemap ───────────────────────────────────────────────────────────────────
# Ilgari sitemap Netlify build paytida yaratilardi va yangilanishi uchun scrape
# workflow kuniga 4 marta build hook ni turtardi — oyiga ~120 production deploy.
# Netlify kreditli tarifida bu bepul limitni bir necha kunda yeb, akkauntdagi
# hamma loyihani pauzaga tushirdi (2026-10). Endi sitemap shu yerda, bazadan
# to'g'ridan-to'g'ri yaratiladi; Netlify /sitemap.xml ni bu yerga proksi qiladi
# (frontend/public/_redirects), ya'ni narxlar yangilanganda deploy kerak emas.
SITEMAP_SITE = "https://bazarcom.online"
# frontend/scripts/seo-postbuild.mjs dagi ROUTES ning indekslanadigan qismi
SITEMAP_ROUTES = (
    ("/", "daily", "1.0"),
    ("/products", "daily", "0.9"),
    ("/trends", "daily", "0.8"),
    ("/feedback", "monthly", "0.4"),
)


def _sitemap_url(loc: str, lastmod: str, changefreq: str, priority: str) -> str:
    return (f"  <url>\n    <loc>{xml_escape(loc)}</loc>\n"
            f"    <lastmod>{lastmod}</lastmod>\n"
            f"    <changefreq>{changefreq}</changefreq>\n"
            f"    <priority>{priority}</priority>\n  </url>")


@router.get("/sitemap.xml")
async def sitemap(request: Request) -> Response:
    xml = _cache_get("sitemap", 3600)
    if xml is None:
        pool: asyncpg.Pool = request.app.state.pool
        rows = await pool.fetch("SELECT id, slug FROM products ORDER BY id")
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        urls = [_sitemap_url(SITEMAP_SITE + path, today, freq, prio)
                for path, freq, prio in SITEMAP_ROUTES]
        for r in rows:
            # src/utils/slug.ts → productPath bilan bir xil: slug, bo'lmasa ID
            slug = (r["slug"] or "").strip()
            path = f"/product/{slug}" if slug else f"/product/{quote(str(r['id']), safe='')}"
            urls.append(_sitemap_url(SITEMAP_SITE + path, today, "weekly", "0.7"))
        xml = _cache_put("sitemap", (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(urls) + "\n</urlset>\n"
        ))
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

    return _spa_html(seo.inject_product_meta(page, product, canonical))
