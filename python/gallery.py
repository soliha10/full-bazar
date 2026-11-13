"""
E'lon sahifasidan to'liq galereya: schema.org Product (JSON-LD) dagi `image`
ro'yxati, bo'lmasa og:image. Ro'yxat sahifalari har e'londan faqat bitta kichik
rasm beradi; sahifaning o'zida esa Castore — 8, Joybox — 9, Radius — 10 ta
(2026-11-13 o'lchovi). E'lon bitta RANGGA tegishli — demak galereyasi ham.

Natija keshda (data/listing_images.csv): har e'lon bir marta yuklanadi, 30
kundan keyin yangilanadi. Galereya bermaydigan do'kon (5 ta sahifada ham
bittadan ortiq rasm yo'q) o'z-o'zidan o'tkazib yuboriladi — ro'yxat qo'lda emas.
"""
from __future__ import annotations

import csv
import html as html_lib
import json
import os
import re
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin, urlparse

CACHE_NAME = "listing_images.csv"
CACHE_FIELDS = ["url", "images", "fetched_at"]
REFRESH_DAYS = 30
PROBE_PAGES = 5
MAX_IMAGES = 12

_LD_RE = re.compile(r"<script[^>]+application/ld\+json[^>]*>(.*?)</script>", re.S | re.I)
_OG_RE = re.compile(r"<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)", re.I)
_THUMB_RE = re.compile(r"thumb|/\d{2,3}x\d{2,3}/|/thumbnails/\d+/", re.I)


def _ld_images(data) -> list[str]:
    out: list[str] = []
    stack = [data]
    while stack:
        node = stack.pop()
        if isinstance(node, list):
            stack.extend(node)
            continue
        if not isinstance(node, dict):
            continue
        stack.extend(node.get("@graph", []) if isinstance(node.get("@graph"), list) else [])
        kinds = node.get("@type")
        kinds = kinds if isinstance(kinds, list) else [kinds]
        if "Product" in kinds:
            images = node.get("image")
            for item in images if isinstance(images, list) else [images]:
                if isinstance(item, dict):
                    item = item.get("url") or item.get("contentUrl")
                if isinstance(item, str) and item.strip():
                    out.append(item.strip())
    return out


def extract_images(page: str, page_url: str) -> list[str]:
    """Sahifadagi mahsulot rasmlari, takrorsiz, mutlaq manzil bilan."""
    found: list[str] = []
    for block in _LD_RE.findall(page or ""):
        try:
            found += _ld_images(json.loads(html_lib.unescape(block.strip())))
        except (ValueError, TypeError):
            continue
    if not found:
        found = _OG_RE.findall(page or "")
    urls: list[str] = []
    for raw in found:
        url = urljoin(page_url, html_lib.unescape(raw))
        if url.startswith("http") and not url.lower().endswith(".svg") and url not in urls:
            urls.append(url)
    # Kichik nusxalar (thumbnail) — katta nusxasi ham bo'lsa tashlanadi
    big = [u for u in urls if not _THUMB_RE.search(u)]
    return (big or urls)[:MAX_IMAGES]


def load_cache(data_dir: str) -> dict[str, dict]:
    path = os.path.join(data_dir, CACHE_NAME)
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8", newline="") as fh:
        return {r["url"]: r for r in csv.DictReader(fh) if r.get("url")}


def cached_images(cache: dict[str, dict], url: str) -> list[str]:
    row = cache.get(url)
    if not row:
        return []
    try:
        return [u for u in json.loads(row.get("images") or "[]") if isinstance(u, str)]
    except ValueError:
        return []


def save_cache(data_dir: str, cache: dict[str, dict]) -> None:
    path = os.path.join(data_dir, CACHE_NAME)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=CACHE_FIELDS)
        w.writeheader()
        for url in sorted(cache):
            w.writerow({k: cache[url].get(k, "") for k in CACHE_FIELDS})
    os.replace(tmp, path)


def _gallery_hosts(cache: dict[str, dict]) -> tuple[set[str], set[str]]:
    """(galereya beradigan hostlar, bermaydiganlar) — keshdagi natijalardan."""
    seen: dict[str, list[int]] = defaultdict(list)
    for url, row in cache.items():
        seen[urlparse(url).netloc].append(len(cached_images(cache, url)))
    rich = {h for h, ns in seen.items() if max(ns) > 1}
    poor = {h for h, ns in seen.items() if len(ns) >= PROBE_PAGES and max(ns) <= 1}
    return rich, poor


def collect(data_dir: str, urls: list[str], fetch, budget_sec: int, delay: float = 0.8, log=print) -> int:
    """
    Keshda yo'q (yoki eskirgan) e'lonlarning galereyasini yuklaydi.
    fetch(url) -> html | None. Hostlar navbat bilan — har do'kon oldinga siljiydi.
    """
    cache = load_cache(data_dir)
    stale = datetime.now(timezone.utc) - timedelta(days=REFRESH_DAYS)
    pending: dict[str, list[str]] = defaultdict(list)
    for url in dict.fromkeys(urls):
        row = cache.get(url)
        if row and row.get("fetched_at", "") >= stale.isoformat():
            continue
        pending[urlparse(url).netloc].append(url)

    deadline = time.monotonic() + budget_sec
    done = 0
    while pending and time.monotonic() < deadline:
        rich, poor = _gallery_hosts(cache)
        for host in list(pending):
            if host in poor or not pending[host]:
                pending.pop(host, None)
                continue
            url = pending[host].pop(0)
            page = fetch(url)
            images = extract_images(page, url) if page else []
            cache[url] = {"url": url, "images": json.dumps(images), "fetched_at": datetime.now(timezone.utc).isoformat()}
            done += 1
            if done % 50 == 0:
                save_cache(data_dir, cache)
                log(f"[gallery] {done} ta sahifa, galereyali hostlar: {sorted(rich)}")
            time.sleep(delay)
            if time.monotonic() >= deadline:
                break
    save_cache(data_dir, cache)
    log(f"[gallery] {done} ta e'lon yuklandi; kesh: {len(cache)} ta")
    return done
