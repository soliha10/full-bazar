"""sitemap.xml — sof hisob (DB siz, testlanadi).

lastmod — haqiqiy sana: mahsulot narxi oxirgi marta o'zgargan kun
(price_history faqat o'zgarishda yoziladi), bo'lmasa qo'shilgan kun. Ilgari
hamma URL da "bugun" turardi — Google bunday lastmod ga ishonmay qo'yadi.
Mahsulot rasmi image:image bo'lib (Google rasm qidiruvi), brend sahifalari
(/brand/<kalit>) alohida URL bo'lib qo'shiladi.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Iterable, Mapping
from urllib.parse import quote
from xml.sax.saxutils import escape as xml_escape

SITE = "https://bazarcom.online"
# frontend/scripts/seo-postbuild.mjs dagi ROUTES ning indekslanadigan qismi
STATIC_ROUTES = (
    ("/", "daily", "1.0"),
    ("/products", "daily", "0.9"),
    ("/trends", "daily", "0.8"),
    ("/feedback", "monthly", "0.4"),
)


def _day(v: Any) -> str | None:
    return v.strftime("%Y-%m-%d") if isinstance(v, datetime) else None


def _url(loc: str, lastmod: str | None, changefreq: str, priority: str, image: str | None = None) -> str:
    parts = [f"  <url>\n    <loc>{xml_escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts.append(f"    <changefreq>{changefreq}</changefreq>\n    <priority>{priority}</priority>")
    if image and image.startswith(("http://", "https://")):
        parts.append(f"    <image:image><image:loc>{xml_escape(image)}</image:loc></image:image>")
    return "\n".join(parts) + "\n  </url>"


def product_path(row: Mapping[str, Any]) -> str:
    """src/utils/slug.ts → productPath bilan bir xil: slug, bo'lmasa ID."""
    slug = (row.get("slug") or "").strip()
    return f"/product/{slug}" if slug else f"/product/{quote(str(row['id']), safe='')}"


def sitemap_xml(rows: Iterable[Mapping[str, Any]], extract_brand: Callable[[str], str]) -> str:
    """rows: {id, slug, name, keywords, image, lastmod (datetime)}."""
    rows = list(rows)
    newest = max((r["lastmod"] for r in rows if isinstance(r.get("lastmod"), datetime)), default=None)
    urls = [_url(SITE + path, _day(newest), freq, prio) for path, freq, prio in STATIC_ROUTES]

    brand_lastmod: dict[str, datetime | None] = {}
    product_urls = []
    for r in rows:
        product_urls.append(_url(SITE + product_path(r), _day(r.get("lastmod")), "daily", "0.7", r.get("image")))
        key = extract_brand(f"{r.get('name') or ''} {r.get('keywords') or ''}")
        if key:
            prev, cur = brand_lastmod.get(key), r.get("lastmod")
            brand_lastmod[key] = max(filter(None, (prev, cur)), default=None)

    urls += [_url(f"{SITE}/brand/{quote(k, safe='')}", _day(v), "daily", "0.8")
             for k, v in sorted(brand_lastmod.items())]
    urls += product_urls
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
            + "\n".join(urls) + "\n</urlset>\n")
