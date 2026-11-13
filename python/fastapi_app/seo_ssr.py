"""Server tomonda #root ichiga yoziladigan ko'rinadigan matn (sof, DB siz).

Sayt — SPA: JavaScript ishlatmaydigan yoki uni kech ishlatadigan qidiruv
botlari (Yandex, Bing, Telegram oldindan ko'rish) bo'sh <div id="root"> ni
ko'rardi. Endi mahsulot va brend sahifalarida o'sha sahifaning asosiy mazmuni
(h1, narx, do'konlar, non bo'laklari, ichki havolalar) oddiy HTML bo'lib keladi.
React (createRoot) yuklanganda uni o'z interfeysi bilan almashtiradi —
foydalanuvchi ko'radigan mazmun bilan bir xil, yashirin matn emas.
"""

from __future__ import annotations

import html as _html
from typing import Any, Iterable

_WRAP = 'style="max-width:80rem;margin:0 auto;padding:1.5rem 1rem;font-family:system-ui,sans-serif"'


def _e(s: Any) -> str:
    return _html.escape("" if s is None else str(s), quote=True)


def _sum(n: Any) -> str:
    try:
        return f"{round(float(n)):,}".replace(",", " ") + " so'm"
    except (TypeError, ValueError):
        return ""


def _crumbs(items: list[tuple[str, str | None]]) -> str:
    parts = [f'<a href="{_e(href)}">{_e(name)}</a>' if href else f"<span>{_e(name)}</span>"
             for name, href in items]
    return f'<nav aria-label="breadcrumb">{" / ".join(parts)}</nav>'


def inject_root(page: str, body: str) -> str:
    """index.html dagi bo'sh #root ga mazmunni yozadi (bo'lmasa — o'zgarishsiz)."""
    return page.replace('<div id="root"></div>', f'<div id="root">{body}</div>', 1)


def product_body(product: dict, brand: tuple[str, str] | None) -> str:
    """Mahsulot: h1, eng arzon narx, do'konlar ro'yxati (narx bo'yicha), non bo'laklari."""
    name = product.get("name") or product.get("title") or ""
    markets = sorted((m for m in (product.get("markets") or []) if m.get("price")),
                     key=lambda m: float(m["price"]))
    crumbs = [("Bosh sahifa", "/"), ("Smartfonlar", "/products")]
    if brand:
        crumbs.append((brand[1], f"/brand/{brand[0]}"))
    crumbs.append((name, None))
    rows = "".join(
        f'<li>{_e(m.get("source"))} — {_e(_sum(m["price"]))}'
        + (f' <a href="{_e(m["url"])}" rel="nofollow sponsored noopener">do\'konga o\'tish</a>' if m.get("url") else "")
        + "</li>"
        for m in markets
    )
    summary = (f"<p>Eng arzon narx: <strong>{_e(_sum(markets[0]['price']))}</strong> — "
               f"{len(markets)} ta do'konda.</p>") if markets else ""
    return (f'<main {_WRAP}>{_crumbs(crumbs)}<h1>{_e(name)}</h1>{summary}'
            + (f"<h2>Do'konlardagi narxlar</h2><ul>{rows}</ul>" if rows else "")
            + "</main>")


def brand_body(brand_name: str, products: Iterable[dict], total: int, min_price: float | None) -> str:
    """Brend: h1, qisqa xulosa, modellar ro'yxati (havola + narx)."""
    items = "".join(
        f'<li><a href="{_e(p["path"])}">{_e(p.get("name"))}</a> — {_e(_sum(p.get("price")))}</li>'
        for p in products if p.get("path")
    )
    summary = f"<p>{total} ta model" + (f", {_e(_sum(min_price))} dan" if min_price else "") + \
        " — O'zbekiston do'konlaridagi narxlarni solishtiring.</p>"
    crumbs = _crumbs([("Bosh sahifa", "/"), ("Smartfonlar", "/products"), (brand_name, None)])
    return (f'<main {_WRAP}>{crumbs}<h1>{_e(brand_name)} smartfonlari narxlari</h1>{summary}'
            + (f"<ul>{items}</ul>" if items else "") + "</main>")
