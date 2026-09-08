from __future__ import annotations

import json
import logging
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://market.beeline.uz"
CATEGORY = f"{BASE}/smartfony"


class BeemarketScraper(BaseScraper):
    store_name = "beemarket"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 30):
            url = f"{CATEGORY}?page={page}" if page > 1 else CATEGORY
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[beemarket] page %d HTTP %d, stopping", page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                json_ld = None
                for s in soup.find_all("script", type="application/ld+json"):
                    try:
                        data = json.loads(s.get_text())
                        if data.get("@type") == "ItemList":
                            json_ld = data
                            break
                    except (json.JSONDecodeError, ValueError):
                        continue

                if not json_ld:
                    logger.info("[beemarket] page %d: no ItemList JSON-LD, stopping", page)
                    break

                items = json_ld.get("itemListElement", [])
                if not items:
                    break

                for entry in items:
                    product = entry.get("item", {})
                    title = product.get("name", "").strip()
                    if not title:
                        continue
                    offer = product.get("offers", {})
                    price = float(offer.get("price", 0) or 0)
                    if not price:
                        continue
                    image = product.get("image", "")
                    product_url = product.get("url", "")

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=image,
                        product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[beemarket] page %d error: %s", page, exc)
                break
