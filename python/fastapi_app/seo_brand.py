"""Brend sahifasi (/brand/<kalit>) HTML iga meta teglar va JSON-LD (sof, DB siz).

"Samsung narxlari", "redmi telefon narxi" kabi so'rovlar uchun ilgari indeks-
lanadigan sahifa yo'q edi: brend filtri /products?brand=... da, robots.txt esa
/products?* ni yopadi. Endi har brendning toza manzili bor.
"""

from __future__ import annotations

import re
from typing import Any

from seo import SITE, _esc, _esc_json_ld, _fmt_price, _replace_tag


def brand_title(name: str, total: int, min_price: float | None) -> str:
    price = f", {_fmt_price(min_price)} so'mdan" if min_price else ""
    return f"{name} smartfonlari narxlari — {total} model{price} | Bazarcom"


def brand_description(name: str, total: int, min_price: float | None, stores: int) -> str:
    price = f" Eng arzoni — {_fmt_price(min_price)} so'm." if min_price else ""
    where = f"{stores} ta do'kondagi" if stores else "O'zbekiston do'konlaridagi"
    return (f"{name} smartfonlari: {total} ta model.{price} {where} narxlarni solishtiring, "
            f"xususiyatlarini ko'ring va narx tushishini kuzating — Bazarcom.")


def inject_brand_meta(page: str, key: str, name: str, products: list[dict[str, Any]],
                      total: int, min_price: float | None, stores: int) -> str:
    url = f"{SITE}/brand/{key}"
    title = brand_title(name, total, min_price)
    description = brand_description(name, total, min_price, stores)
    image = next((p["image"] for p in products if re.match(r"^https?://", p.get("image") or "")),
                 f"{SITE}/og-image.jpg")

    json_ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage", "@id": f"{url}#page", "url": url, "name": title,
                "description": description, "inLanguage": "uz",
                "isPartOf": {"@id": f"{SITE}/#website"},
                "about": {"@type": "Brand", "name": name},
                "mainEntity": {
                    "@type": "ItemList", "numberOfItems": total,
                    "itemListElement": [
                        {"@type": "ListItem", "position": i + 1, "url": SITE + p["path"], "name": p.get("name")}
                        for i, p in enumerate(products)
                    ],
                },
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Bosh sahifa", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": "Smartfonlar", "item": f"{SITE}/products"},
                    {"@type": "ListItem", "position": 3, "name": name, "item": url},
                ],
            },
        ],
    }

    page = re.sub(r"<title>[\s\S]*?</title>", lambda _: f"<title>{_esc(title)}</title>",
                  page, count=1, flags=re.IGNORECASE)
    for pattern, value in (
        (r'<meta[^>]*name="description"[^>]*>', description),
        (r'<meta[^>]*property="og:title"[^>]*>', title),
        (r'<meta[^>]*property="og:description"[^>]*>', description),
        (r'<meta[^>]*property="og:url"[^>]*>', url),
        (r'<meta[^>]*property="og:image"[^>]*>', image),
        (r'<meta[^>]*property="og:image:alt"[^>]*>', f"{name} smartfonlari"),
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
