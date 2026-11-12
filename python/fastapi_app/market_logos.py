"""
Do'kon logotiplari — qo'lda yozilgan ro'yxat YO'Q.

Do'konning domeni bazadagi o'z e'lonlari havolalaridan olinadi
(product_markets.url), logotip esa shu saytning o'zidan: bosh sahifadagi
<link rel="apple-touch-icon"> / <link rel="icon">, keyin /apple-touch-icon.png.
Ba'zi do'konlar (asaxiy, olcha) serverimizdan so'rovlarni 403 bilan qaytaradi —
ular uchun ochiq favicon xizmati zaxira. Hech biri topilmasa 404: mijoz
do'kon nomining bosh harfini ko'rsatadi.
"""

from __future__ import annotations

import re
import time
from collections import Counter
from typing import TYPE_CHECKING
from urllib.parse import urljoin

import httpx

if TYPE_CHECKING:
    import asyncpg

_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
_TTL = 7 * 24 * 3600
_MISS_TTL = 6 * 3600
_LINK_RE = re.compile(r"<link\b[^>]*>", re.I)
_REL_RE = re.compile(r"""rel\s*=\s*["']([^"']+)["']""", re.I)
_HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.I)
_SIZES_RE = re.compile(r"""sizes\s*=\s*["'](\d+)x\d+["']""", re.I)
_HOST_RE = re.compile(r"^https?://([^/?#]+)", re.I)

# key -> (vaqt, bayt yoki None, content-type)
_logos: dict[str, tuple[float, bytes | None, str]] = {}


async def market_domains(pool: "asyncpg.Pool") -> dict[str, str]:
    """Har bir do'kon uchun e'lonlarida eng ko'p uchraydigan domen."""
    rows = await pool.fetch(
        "SELECT lower(source) AS key, url FROM product_markets WHERE url LIKE 'http%'"
    )
    hosts: dict[str, Counter] = {}
    for r in rows:
        m = _HOST_RE.match(r["url"] or "")
        if m:
            host = m.group(1).lower().removeprefix("www.")
            hosts.setdefault(r["key"], Counter())[host] += 1
    return {k: c.most_common(1)[0][0] for k, c in hosts.items()}


def _icon_links(html: str, base: str) -> list[tuple[int, str]]:
    """Bosh sahifadagi ikonkalar, kattasi birinchi (apple-touch-icon odatda 180px)."""
    found: list[tuple[int, str]] = []
    for tag in _LINK_RE.findall(html[:200_000]):
        rel = _REL_RE.search(tag)
        href = _HREF_RE.search(tag)
        if not rel or not href or "icon" not in rel.group(1).lower():
            continue
        size = _SIZES_RE.search(tag)
        score = int(size.group(1)) if size else (180 if "apple" in rel.group(1).lower() else 32)
        found.append((score, urljoin(base, href.group(1).strip())))
    return sorted(found, key=lambda x: -x[0])


async def _get_image(http: httpx.AsyncClient, url: str) -> tuple[bytes, str] | None:
    try:
        resp = await http.get(url, headers={"User-Agent": _UA}, follow_redirects=True, timeout=8)
    except Exception:
        return None
    ctype = resp.headers.get("content-type", "").split(";")[0].strip()
    # 1x1 bo'sh piksel yoki HTML xato sahifasi logotip emas
    if resp.status_code != 200 or not ctype.startswith("image/") or len(resp.content) < 200:
        return None
    return resp.content, ctype


async def _resolve(http: httpx.AsyncClient, domain: str) -> tuple[bytes, str] | None:
    base = f"https://{domain}/"
    icons: list[tuple[int, str]] = []
    try:
        page = await http.get(base, headers={"User-Agent": _UA}, follow_redirects=True, timeout=8)
        if page.status_code == 200:
            icons = _icon_links(page.text, str(page.url))
    except Exception:
        pass
    # Katta ikonka (≥96px) > standart /apple-touch-icon.png > 16–32px favicon
    candidates = ([u for size, u in icons if size >= 96] + [urljoin(base, "apple-touch-icon.png")]
                  + [u for size, u in icons if size < 96]
                  + [f"https://www.google.com/s2/favicons?domain={domain}&sz=128"])
    for url in candidates:
        if url.lower().endswith(".svg"):
            continue  # <img> uchun yaroqli, lekin ba'zilarida skript bor — xavfsizroq emas
        img = await _get_image(http, url)
        if img:
            return img
    return None


async def market_logo(http: httpx.AsyncClient, key: str, domain: str) -> tuple[bytes, str] | None:
    now = time.time()
    hit = _logos.get(key)
    if hit and now - hit[0] < (_TTL if hit[1] else _MISS_TTL):
        return (hit[1], hit[2]) if hit[1] else None
    img = await _resolve(http, domain)
    _logos[key] = (now, img[0] if img else None, img[1] if img else "")
    return img
