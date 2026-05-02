from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

API_URL = "https://api.client.mediapark.uz/v2/child-subcategory/meili-products-filter"
SUBCATEGORY_ID = 40  # smartfony-40 from navlinks
ITEMS_PER_PAGE = 10  # server-side fixed limit
MAX_PAGES = 100


class MediaparkScraper(BaseScraper):
    """Mediapark.uz — via internal API (api.client.mediapark.uz)."""

    store_name = "mediapark"

    def scrape(self) -> Iterator[ProductRow]:
        headers = {
            "Accept": "application/json",
            "Origin": "https://mediapark.uz",
            "Referer": "https://mediapark.uz/ru/products/category/telefony-17/smartfony-40",
        }

        for page in range(1, MAX_PAGES + 1):
            resp = self.get(
                API_URL,
                params={"subcategory_id": SUBCATEGORY_ID, "page": page, "perPage": ITEMS_PER_PAGE},
                headers=headers,
                json_mode=True,
            )
            try:
                data = resp.json()
            except Exception:
                break
            if not data:
                break

            products = (data.get("data") or {}).get("products", [])
            if not products:
                logger.info("[mediapark] page %d: no products, stopping", page)
                break

            for item in products:
                name = (item.get("name") or {}).get("ru") or (item.get("name") or {}).get("uz", "")
                if not name:
                    continue

                price = item.get("actual_price") or item.get("core_price") or 0
                if not price:
                    continue

                photos = item.get("mobile_photos") or item.get("photos") or []
                image_url = photos[0] if photos else ""

                slug = (item.get("url_slug") or {}).get("ru", "")
                product_url = f"https://mediapark.uz/ru/product/{slug}" if slug else ""

                yield ProductRow(
                    title=name,
                    price=float(price),
                    store=self.store_name,
                    image_url=image_url,
                    product_url=product_url,
                )

            logger.info("[mediapark] page %d: %d products", page, len(products))

            if len(products) < ITEMS_PER_PAGE:
                break
