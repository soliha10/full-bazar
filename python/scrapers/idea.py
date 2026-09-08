from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

API_URL = "https://api.idea.uz/api/v2/products"
CATEGORY_ID = 55  # "Смартфоны" category
PER_PAGE = 24


class IdeaScraper(BaseScraper):
    """idea.uz — via REST API (api.idea.uz/api/v2/products)."""

    store_name = "idea"

    def scrape(self) -> Iterator[ProductRow]:
        headers = {
            "Accept": "application/json",
            "Origin": "https://idea.uz",
            "Referer": "https://idea.uz/category/55-mobil-nye-telefony",
        }

        page = 1
        while True:
            resp = self.get(
                API_URL,
                params={"category_id": CATEGORY_ID, "per_page": PER_PAGE, "page": page},
                headers=headers,
                json_mode=True,
            )
            try:
                data = resp.json()
            except Exception:
                break

            items = data.get("data", [])
            if not items:
                break

            for item in items:
                name = item.get("name", "")
                if not name:
                    continue

                price = item.get("current_price") or item.get("min_price") or 0
                if not price:
                    continue

                image_url = item.get("img") or item.get("medium_img") or ""
                product_url = item.get("url") or ""
                rating = str(item.get("rating") or "")
                review_count = str(item.get("rating_count") or "")

                yield ProductRow(
                    title=name,
                    price=float(price),
                    store=self.store_name,
                    image_url=image_url,
                    product_url=product_url,
                    rating=rating,
                    review_count=review_count,
                )

            logger.info("[idea] page %d: %d products", page, len(items))

            meta = data.get("meta", {})
            last_page = meta.get("last_page") or 1
            if page >= last_page:
                break
            page += 1
