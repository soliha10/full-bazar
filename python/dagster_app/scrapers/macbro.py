from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://macbro.uz"


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class MacbroScraper(BaseScraper):
    store_name = "macbro"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 20):
            url = f"{BASE}/catalog/smartfony/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(".product-card, .catalog-item, .product-item, [class*='product']")
                cards = [c for c in cards if c.find(string=re.compile(r"\d{5,}"))]
                if not cards:
                    logger.info("[macbro] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    name_el = card.select_one(
                        ".product-card__name, .product-name, h3, h2, [class*='name'], [class*='title']"
                    )
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = card.select_one(
                        "[class*='price']:not([class*='old']):not([class*='before'])"
                    )
                    price = _price(price_el.get_text() if price_el else "")
                    if not price:
                        continue

                    img = card.find("img")
                    src = ""
                    if img:
                        src = img.get("src") or img.get("data-src") or img.get("data-lazy") or ""
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
                logger.warning("[macbro] page %d error: %s", page, exc)
                break
