from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://chakana.uz"


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class ChakanaScraper(BaseScraper):
    store_name = "chakana"

    def scrape(self) -> Iterator[ProductRow]:
        category_urls = [
            f"{BASE}/catalog/smartfony",
            f"{BASE}/catalog/smartfonlar",
            f"{BASE}/c/smartfonlar",
            f"{BASE}/phones",
        ]
        working_url = None
        for cat_url in category_urls:
            resp = self.get(cat_url)
            if resp.ok and len(resp.text) > 2000:
                working_url = cat_url
                break

        if not working_url:
            logger.warning("[chakana] could not find working category URL")
            return

        for page in range(1, 20):
            url = f"{working_url}?page={page}" if page > 1 else working_url
            try:
                resp = self.get(url)
                if not resp.ok:
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(
                    ".product-card, .product-item, .catalog-item, "
                    "[class*='product-card'], [class*='ProductCard']"
                )
                if not cards:
                    logger.info("[chakana] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    name_el = card.select_one("[class*='name'], [class*='title'], h3, h2")
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = card.select_one(
                        "[class*='price']:not([class*='old'])"
                    )
                    price = _price(price_el.get_text() if price_el else "")
                    if not price:
                        continue

                    img = card.find("img")
                    src = (img.get("src") or img.get("data-src") or "") if img else ""
                    if src and not src.startswith("http"):
                        src = BASE + src

                    a_el = card.find("a", href=True)
                    href = a_el["href"] if a_el else ""
                    product_url = href if href.startswith("http") else BASE + href

                    yield ProductRow(
                        title=title, price=price, store=self.store_name,
                        image_url=src, product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[chakana] page %d error: %s", page, exc)
                break
