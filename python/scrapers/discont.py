from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
API_BASE = "https://api.diskont.uz"
# Category 92 = Смартфоны (parent, includes all brand subcategories)
CATEGORY_ID = 92
PAGE_SIZE = 100


class DiscontScraper(BaseScraper):
    """diskont.uz — uses api.diskont.uz/api/v2/products REST API (JSON, no auth needed)."""
    store_name = "discont"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while True:
            url = f"{API_BASE}/api/v2/products?quantity={PAGE_SIZE}&category_id={CATEGORY_ID}&page={page}"
            try:
                resp = self.get(url, json_mode=True)
                if not resp.ok:
                    logger.warning("[discont] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                data = resp.json()
                products = data.get("data", [])
                if not products:
                    logger.info("[discont] page %d: no products, stopping", page)
                    break

                meta = data.get("meta", {})
                last_page = meta.get("last_page", page)

                for prod in products:
                    name = (prod.get("name") or "").strip()
                    if not name:
                        continue

                    price = float(prod.get("current_price") or prod.get("old_price") or 0)
                    if not price:
                        continue

                    product_url = prod.get("url") or ""
                    image_url = prod.get("img") or ""

                    yield ProductRow(
                        title=name,
                        price=price,
                        store=self.store_name,
                        image_url=image_url,
                        product_url=product_url,
                    )

                logger.info("[discont] page %d/%d: %d products", page, last_page, len(products))

                if page >= last_page:
                    break
                page += 1

            except Exception as exc:
                logger.warning("[discont] page %d error: %s", page, exc)
                break
