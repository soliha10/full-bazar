from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class MiScraper(BaseScraper):
    """Xiaomi official store — tries mi.com/uz then mistore.uz."""
    store_name = "mi"

    def scrape(self) -> Iterator[ProductRow]:
        # Try Xiaomi Uzbekistan official site
        candidates = [
            ("https://www.mi.com/uz", "/c/phones/", "mi.com/uz"),
            ("https://mistore.uz", "/catalog/smartfony", "mistore.uz"),
            ("https://mi.uz", "/catalog/smartfony", "mi.uz"),
        ]

        for base, cat_path, label in candidates:
            try:
                resp = self.get(f"{base}{cat_path}")
                if not resp.ok or len(resp.text) < 2000:
                    continue
                soup = BeautifulSoup(resp.text, "lxml")
                cards = soup.select(
                    ".product-item, .goods-item, .phone-item, "
                    "[class*='product'], [class*='phone-card']"
                )
                if not cards:
                    continue

                logger.info("[mi] using %s, found %d cards", label, len(cards))

                for page in range(1, 10):
                    page_url = f"{base}{cat_path}?page={page}" if page > 1 else f"{base}{cat_path}"
                    try:
                        resp = self.get(page_url)
                        if not resp.ok:
                            break
                        soup = BeautifulSoup(resp.text, "lxml")
                        cards = soup.select(
                            ".product-item, .goods-item, .phone-item, "
                            "[class*='product'], [class*='phone-card'], [class*='ProductCard']"
                        )
                        if not cards:
                            break

                        for card in cards:
                            name_el = card.select_one(
                                "[class*='name'], [class*='title'], h3, h2, .product-title"
                            )
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
                                src = base + src

                            a_el = card.find("a", href=True)
                            href = a_el["href"] if a_el else ""
                            product_url = href if href.startswith("http") else base + href

                            yield ProductRow(
                                title=title, price=price, store=self.store_name,
                                image_url=src, product_url=product_url,
                            )
                    except Exception as exc:
                        logger.warning("[mi] %s page %d error: %s", label, page, exc)
                        break
                return  # done after first working source
            except Exception as exc:
                logger.warning("[mi] %s failed: %s", label, exc)
                continue

        logger.warning("[mi] all source URLs failed")
