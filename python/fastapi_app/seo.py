"""Mahsulot sahifasi HTML iga meta teglar va Product JSON-LD yozadi.

frontend/functions/_lib/product-meta.ts ning Python nusxasi — VPS da
Cloudflare/Netlify funksiyasi yo'q, /product/* ni Caddy shu API ga uzatadi
(pages.py: product_page). Sayt — SPA, Telegram/Facebook/WhatsApp botlari esa
JavaScript ishlatmaydi, shuning uchun meta teglar server tomonda qo'yiladi.
Ikkala nusxa bir xil natija berishi kerak.
"""
from __future__ import annotations

import html as _html
import json
import re
from typing import Any
from urllib.parse import quote, unquote

SITE = "https://bazarcom.online"

# Eski manzillarda slugdan keyin turgan ID: ...-prod-8fc7e81f5ca9aeb6051c
_LEGACY_ID_RE = re.compile(r"(prod-[0-9a-f]{20})$", re.IGNORECASE)


def product_ref(param: str) -> str:
    """src/utils/slug.ts → productRef bilan bir xil."""
    if not param:
        return ""
    try:
        raw = unquote(param, errors="strict")
    except UnicodeDecodeError:
        raw = param
    clean = raw.strip().rstrip("/").lower()
    m = _LEGACY_ID_RE.search(clean)
    return m.group(1) if m else clean


def product_path(product: dict) -> str:
    """src/utils/slug.ts → productPath bilan bir xil."""
    slug = (product.get("slug") or "").strip()
    if slug:
        return f"/product/{slug}"
    return f"/product/{quote(str(product.get('id')), safe='')}"


def _esc(s: Any) -> str:
    return _html.escape("" if s is None else str(s), quote=True).replace("&#x27;", "'")


def _esc_json_ld(obj: Any) -> str:
    # JSON-LD ichida </script> bilan HTML dan chiqib ketishning oldini oladi
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace(">", "\\u003e")


def _fmt_price(n: float) -> str:
    # Intl.NumberFormat('ru-RU') — minglar orasida tor bo'shliq (U+00A0)
    return f"{round(n):,}".replace(",", " ")


def _num(v: Any) -> float | int:
    try:
        n = float(v)
    except (TypeError, ValueError):
        return 0.0
    if n != n or n in (float("inf"), float("-inf")):
        return 0
    # JS dagi kabi butun son "12500000.0" emas, "12500000" bo'lib chiqsin
    return int(n) if n.is_integer() else n


_ATTR_RE = re.compile(r'(content|href)="[^"]*"', re.IGNORECASE)


def _replace_tag(page: str, pattern: str, value: str) -> str:
    """<meta>/<link> qiymatini almashtiradi (birinchi mos kelganini)."""
    def sub(m: re.Match) -> str:
        return _ATTR_RE.sub(lambda a: f'{a.group(1)}="{_esc(value)}"', m.group(0), count=1)
    return re.sub(pattern, sub, page, count=1, flags=re.IGNORECASE)


def inject_product_meta(page: str, product: dict, canonical_path: str,
                        brand_name: str | None = None, brand_key: str | None = None) -> str:
    """brand_name — nomdan aniqlangan brend (pages.py); ilgari brand o'rniga kategoriya yozilardi."""
    # Sahifadagi h1 bilan bir xil — do'kondan kelgan xom title (ko'pincha ruscha) emas
    name = product.get("name") or product.get("title")
    url = SITE + canonical_path
    markets = product.get("markets") if isinstance(product.get("markets"), list) else []
    prices = [p for p in (_num(m.get("price")) for m in markets) if p > 0]
    price = _num(product.get("price")) or (min(prices) if prices else 0)
    store_count = len(markets) or 1

    if price:
        title = f"{name} narxi — {_fmt_price(price)} so'mdan | Bazarcom"
        description = (
            f"{name} — O'zbekistonda eng arzon narxi {_fmt_price(price)} so'm. "
            f"{store_count} ta do'kondagi narxlarni solishtiring, xususiyatlarini ko'ring "
            f"va narx tushishini kuzating."
        )
    else:
        title = f"{name} | Bazarcom"
        description = f"{name} — O'zbekiston do'konlaridagi narxlari, xususiyatlari va taqqoslash. Bazarcom."

    img = product.get("image") or ""
    image = img if re.match(r"^https?://", img) else f"{SITE}/og-image.jpg"
    availability = ("https://schema.org/OutOfStock" if product.get("inStock") is False
                    else "https://schema.org/InStock")

    # ── JSON-LD: Product + BreadcrumbList ────────────────────────────────────
    if len(prices) > 1:
        offers: dict[str, Any] = {
            "@type": "AggregateOffer", "url": url, "priceCurrency": "UZS",
            "lowPrice": min(prices), "highPrice": max(prices),
            "offerCount": len(prices), "availability": availability,
            # Har do'kon — alohida taklif (sotuvchi nomi bilan): qidiruvda
            # "N do'konda X so'mdan" ko'rinishi uchun
            "offers": [
                {"@type": "Offer", "price": _num(m.get("price")), "priceCurrency": "UZS",
                 "url": m.get("url") or url, "availability": availability,
                 "itemCondition": "https://schema.org/NewCondition",
                 "seller": {"@type": "Organization", "name": m.get("source")}}
                for m in sorted(markets, key=lambda m: _num(m.get("price")))
                if _num(m.get("price")) > 0
            ],
        }
    else:
        offers = {"@type": "Offer", "url": url, "priceCurrency": "UZS"}
        if price:
            offers["price"] = price
        offers["itemCondition"] = "https://schema.org/NewCondition"
        offers["availability"] = availability

    gallery = [i for i in (product.get("images") or []) if isinstance(i, str) and re.match(r"^https?://", i)]
    product_ld: dict[str, Any] = {
        "@type": "Product", "name": name, "sku": product.get("id"),
        "image": ([image] + [i for i in gallery if i != image])[:6],
        "description": description,
        "offers": offers,
    }
    if brand_name:
        product_ld["brand"] = {"@type": "Brand", "name": brand_name}
    rating, reviews = _num(product.get("rating")), _num(product.get("reviews"))
    if rating > 0 and reviews > 0:
        product_ld["aggregateRating"] = {
            "@type": "AggregateRating", "ratingValue": rating, "reviewCount": reviews,
            "bestRating": 5, "worstRating": 1,
        }

    json_ld = {
        "@context": "https://schema.org",
        "@graph": [
            product_ld,
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Bosh sahifa", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": "Smartfonlar", "item": f"{SITE}/products"},
                    *([{"@type": "ListItem", "position": 3, "name": brand_name,
                        "item": f"{SITE}/brand/{brand_key}"}] if brand_name and brand_key else []),
                    {"@type": "ListItem", "position": 4 if brand_name and brand_key else 3, "name": name, "item": url},
                ],
            },
        ],
    }

    # ── HTML ga yozish ───────────────────────────────────────────────────────
    page = re.sub(r"<title>[\s\S]*?</title>", lambda _: f"<title>{_esc(title)}</title>",
                  page, count=1, flags=re.IGNORECASE)
    for pattern, value in (
        (r'<meta[^>]*name="description"[^>]*>', description),
        (r'<meta[^>]*property="og:title"[^>]*>', title),
        (r'<meta[^>]*property="og:description"[^>]*>', description),
        (r'<meta[^>]*property="og:url"[^>]*>', url),
        (r'<meta[^>]*property="og:image"[^>]*>', image),
        (r'<meta[^>]*property="og:image:alt"[^>]*>', name),
        (r'<meta[^>]*property="og:type"[^>]*>', "product"),
        (r'<meta[^>]*name="twitter:title"[^>]*>', title),
        (r'<meta[^>]*name="twitter:description"[^>]*>', description),
        (r'<meta[^>]*name="twitter:image"[^>]*>', image),
        (r'<link[^>]*rel="canonical"[^>]*>', url),
    ):
        page = _replace_tag(page, pattern, value)

    return page.replace(
        "</head>",
        f'  <script type="application/ld+json" id="ld-json-server">{_esc_json_ld(json_ld)}</script>\n  </head>',
        1,
    )
