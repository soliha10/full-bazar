from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://brandstore.uz"
API_BASE = "https://api.brandstore.uz"
# Category 1674 = Смартфоны и гаджеты (210 products)
CATEGORY_ID = 1674


class BrandstoreScraper(BaseScraper):
    """brandstore.uz — uses https://api.brandstore.uz REST API (JSON, no browser needed)."""
    store_name = "brandstore"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while True:
            url = f"{API_BASE}/api/products?category_id={CATEGORY_ID}&page={page}&limit=50"
            try:
                resp = self.get(url, json_mode=True)
                if not resp.ok:
                    logger.warning("[brandstore] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                data = resp.json()
                products = data.get("data", []) if isinstance(data, dict) else data
                if not products:
                    logger.info("[brandstore] page %d: no products, stopping", page)
                    break

                meta = data.get("meta", {}) if isinstance(data, dict) else {}
                last_page = meta.get("last_page", page)

                for prod in products:
                    name = (prod.get("name") or "").strip()
                    if not name:
                        continue

                    shop = prod.get("random_shop") or {}
                    price = float(shop.get("price") or 0)
                    if not price:
                        continue

                    web_url = prod.get("web_url") or ""
                    images = prod.get("images") or []
                    image_url = images[0]["url"] if images else ""

                    yield ProductRow(
                        title=name,
                        price=price,
                        store=self.store_name,
                        image_url=image_url,
                        product_url=web_url,
                    )

                logger.info("[brandstore] page %d/%d: %d products", page, last_page, len(products))

                if page >= last_page:
                    break
                page += 1

            except Exception as exc:
                logger.warning("[brandstore] page %d error: %s", page, exc)
                break
