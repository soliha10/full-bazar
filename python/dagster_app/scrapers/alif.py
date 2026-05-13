from __future__ import annotations

import json
import logging
import re
from typing import Any, Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://alifshop.uz"
CATEGORY_PATH = "/uz/categories/smartfoni-i-telefoni"
IMAGE_CDN = "https://cdn.alifshop.uz"


def _resolve(val: Any, data: list, depth: int = 0, visited: set | None = None) -> Any:
    """Resolve Nuxt dehydrated state: integers are indices into the same array."""
    if visited is None:
        visited = set()
    if depth > 20:
        return val
    if isinstance(val, int) and 0 <= val < len(data):
        if val in visited:
            return None
        visited = visited | {val}
        return _resolve(data[val], data, depth + 1, visited)
    if isinstance(val, list):
        return [_resolve(v, data, depth + 1, visited) for v in val]
    if isinstance(val, dict):
        return {k: _resolve(v, data, depth + 1, visited) for k, v in val.items()}
    return val


def _extract_products(nuxt_data: list) -> list[dict]:
    """Walk the dehydrated Nuxt state array and collect product dicts."""
    products = []
    seen_ids = set()
    for item in nuxt_data:
        if not isinstance(item, dict):
            continue
        if "offer_id" in item and "name" in item and "price" in item:
            resolved = _resolve(item, nuxt_data)
            if not isinstance(resolved, dict):
                continue
            oid = resolved.get("offer_id")
            if oid in seen_ids:
                continue
            seen_ids.add(oid)
            products.append(resolved)
    return products


class AlifScraper(BaseScraper):
    """alifshop.uz — parses __NUXT_DATA__ dehydrated state (no browser needed)."""
    store_name = "alif"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 300):
            url = f"{BASE}{CATEGORY_PATH}?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[alif] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "lxml")
                script_tag = soup.find("script", id="__NUXT_DATA__")
                if not script_tag:
                    logger.info("[alif] page %d: no __NUXT_DATA__, stopping", page)
                    break

                try:
                    nuxt_data = json.loads(script_tag.string)
                except (json.JSONDecodeError, TypeError):
                    logger.warning("[alif] page %d: failed to parse __NUXT_DATA__", page)
                    break

                if not isinstance(nuxt_data, list):
                    break

                products = _extract_products(nuxt_data)
                if not products:
                    logger.info("[alif] page %d: no products found, stopping", page)
                    break

                for prod in products:
                    name = prod.get("name") or ""
                    if isinstance(name, int):
                        name = str(name)
                    name = str(name).strip()
                    if not name:
                        continue

                    raw_price = prod.get("price", 0)
                    try:
                        price = float(raw_price) / 100.0
                    except (TypeError, ValueError):
                        continue
                    if not price:
                        continue

                    slug = prod.get("slug") or prod.get("offer_id") or ""
                    product_url = f"{BASE}/uz/products/{slug}" if slug else ""

                    image_path = prod.get("image_path") or prod.get("image") or ""
                    if image_path and not str(image_path).startswith("http"):
                        image_url = IMAGE_CDN + "/" + str(image_path).lstrip("/")
                    else:
                        image_url = str(image_path)

                    yield ProductRow(
                        title=name,
                        price=price,
                        store=self.store_name,
                        image_url=image_url,
                        product_url=product_url,
                    )

                logger.info("[alif] page %d: scraped %d products", page, len(products))

            except Exception as exc:
                logger.warning("[alif] page %d error: %s", page, exc)
                break
