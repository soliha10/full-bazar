from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://shop.ucell.uz"


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class UcellScraper(BaseScraper):
    """shop.ucell.uz — Ucell telecom operator's device shop."""
    store_name = "ucell"

    def scrape(self) -> Iterator[ProductRow]:
        category_url = f"{BASE}/uz/catalog/mobiljnje-telefonj"
        try:
            resp = self.get(category_url)
            if not resp.ok:
                logger.warning("[ucell] category page HTTP %d", resp.status_code)
                return
        except Exception as exc:
            logger.warning("[ucell] failed to load category: %s", exc)
            return

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select(".products-item")
        if not cards:
            logger.warning("[ucell] no .products-item cards found")
            return

        for card in cards:
            a_el = card.find("a", href=True)
            if not a_el:
                continue

            title_el = card.select_one(".product_title")
            title = title_el.get_text(strip=True) if title_el else ""
            if not title:
                img = card.find("img")
                title = (img.get("title") or img.get("alt") or "").strip() if img else ""
            if not title:
                continue

            price_el = card.select_one(".product_price-price")
            price = _price(price_el.get_text() if price_el else "")
            if not price:
                continue

            href = a_el["href"]
            product_url = href if href.startswith("http") else BASE + href

            yield ProductRow(
                title=title, price=price, store=self.store_name,
                image_url="", product_url=product_url,
            )
