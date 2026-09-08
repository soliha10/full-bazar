from __future__ import annotations

import logging
import time
import random
from typing import Iterator

from .base import BaseScraper, ProductRow, JSON_HEADERS

logger = logging.getLogger(__name__)
BASE = "https://openshop.uz"
API_BASE = "https://web.openshop.uz/api/v1"
# Subcategory slug for Smartphones (id=4, subcategory of Phones & Tablets id=11)
SUBCATEGORY_SLUG = "4-smartfonlar"


class OpenshopScraper(BaseScraper):
    """openshop.uz — uses /shop/product/get_products REST API (POST, session-based pagination)."""
    store_name = "openshop"

    def _post(self, url: str) -> dict:
        time.sleep(self.delay + random.uniform(0, 0.5))
        resp = self.session.post(url, headers=JSON_HEADERS, timeout=20)
        resp.raise_for_status()
        return resp.json()

    def scrape(self) -> Iterator[ProductRow]:
        # First request establishes session cookie with the category filter
        first_url = f"{API_BASE}/shop/product/get_products?subcategory_slug={SUBCATEGORY_SLUG}"
        try:
            data = self._post(first_url)
        except Exception as exc:
            logger.warning("[openshop] initial request failed: %s", exc)
            return

        products = data.get("data", [])
        meta = data.get("meta", {})
        last_page = meta.get("last_page", 1) if isinstance(meta, dict) else 1

        for prod in products:
            row = self._parse(prod)
            if row:
                yield row

        logger.info("[openshop] page 1/%d: %d products", last_page, len(products))

        for page in range(2, last_page + 1):
            url = f"{API_BASE}/shop/product/get_products?subcategory_slug={SUBCATEGORY_SLUG}&page={page}"
            try:
                data = self._post(url)
                products = data.get("data", []) if isinstance(data, dict) else data

                if not products:
                    logger.info("[openshop] page %d: no products, stopping", page)
                    break

                for prod in products:
                    row = self._parse(prod)
                    if row:
                        yield row

                logger.info("[openshop] page %d/%d: %d products", page, last_page, len(products))

            except Exception as exc:
                logger.warning("[openshop] page %d error: %s", page, exc)
                break

    def _parse(self, prod: dict) -> ProductRow | None:
        name = (prod.get("name") or "").strip()
        if not name:
            return None

        price_info = prod.get("price") or {}
        price = float(price_info.get("total") or price_info.get("timer_price") or 0)
        if not price:
            return None

        slug = prod.get("slug") or prod.get("id") or ""
        product_url = f"{BASE}/shop/product/{slug}" if slug else ""

        image_url = prod.get("thumbnail_img") or ""

        return ProductRow(
            title=name,
            price=price,
            store=self.store_name,
            image_url=image_url,
            product_url=product_url,
        )
