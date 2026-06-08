from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.olx.uz"
MIN_PRICE = 200_000

# Focused furniture subcategories covering user's requested items
FURNITURE_SUBCATEGORIES = [
    "dom-i-sad/mebel/mebel-dlya-gostinoy",   # divans, kreslolar (living room)
    "dom-i-sad/mebel/kuhonnaya-mebel",         # oshxona mebeli
    "dom-i-sad/mebel/mebel-dlya-spalni",       # yotoq xona
    "dom-i-sad/mebel/ofisnaya-mebel",          # ofis mebeli
]


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


def _upgrade_image(src: str) -> str:
    """Replace OLX thumbnail params with higher quality version."""
    if src and "olxcdn.com" in src:
        return re.sub(r";s=\d+x\d+;q=\d+", ";s=644x461;q=80", src)
    return src


class OlxFurnitureScraper(BaseScraper):
    """olx.uz — furniture listings from dom-i-sad/mebel subcategories."""
    store_name = "olx_furniture"

    def _scrape_category(self, category_path: str) -> Iterator[ProductRow]:
        seen_urls: set[str] = set()
        for page in range(1, 10):
            url = f"{BASE}/{category_path}/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[olx_furniture] %s page %d HTTP %d", category_path, page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select("[data-cy='l-card']")
                if not cards:
                    logger.info("[olx_furniture] %s page %d: no cards, stopping", category_path, page)
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

                    a_el = card.find("a", href=True)
                    href = a_el["href"] if a_el else ""
                    product_url = href if href.startswith("http") else BASE + href
                    if product_url in seen_urls:
                        continue
                    seen_urls.add(product_url)

                    img = card.find("img")
                    src = _upgrade_image((img.get("src") or img.get("data-src") or "") if img else "")

                    yield ProductRow(
                        title=title,
                        price=price,
                        store="olx",
                        image_url=src,
                        product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[olx_furniture] %s page %d error: %s", category_path, page, exc)
                break

    def scrape(self) -> Iterator[ProductRow]:
        for cat in FURNITURE_SUBCATEGORIES:
            yield from self._scrape_category(cat)
