from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.olx.uz"
MIN_PRICE = 200_000


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class OlxFurnitureScraper(BaseScraper):
    """olx.uz — furniture listings from dom-i-sad/mebel category."""
    store_name = "olx_furniture"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 15):
            url = f"{BASE}/dom-i-sad/mebel/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[olx_furniture] page %d HTTP %d", page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select("[data-cy='l-card']")
                if not cards:
                    logger.info("[olx_furniture] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    name_el = card.select_one("h4, h6")
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = card.select_one(
                        "[data-testid='ad-price'], [class*='price'], p[class*='price']"
                    )
                    price = _price(price_el.get_text() if price_el else "")
                    if price < MIN_PRICE:
                        continue

                    img = card.find("img")
                    src = (img.get("src") or img.get("data-src") or "") if img else ""

                    a_el = card.find("a", href=True)
                    href = a_el["href"] if a_el else ""
                    product_url = href if href.startswith("http") else BASE + href

                    yield ProductRow(
                        title=title,
                        price=price,
                        store="olx",
                        image_url=src,
                        product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[olx_furniture] page %d error: %s", page, exc)
                break
