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


BASE = "https://mi.uz"
CATEGORY = f"{BASE}/category/smartfonlar"


class MiScraper(BaseScraper):
    """mi.uz — Xiaomi official store Uzbekistan."""
    store_name = "mi"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 15):
            url = f"{CATEGORY}?page={page}" if page > 1 else CATEGORY
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[mi] page %d HTTP %d, stopping", page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select("div.product")
                if not cards:
                    logger.info("[mi] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    name_el = card.select_one(".productName")
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        a_link = card.find("a", href=True)
                        title = a_link.get_text(strip=True) if a_link else ""
                    if not title:
                        continue

                    price_el = card.select_one(".fw-bold.text-orange")
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
                logger.warning("[mi] page %d error: %s", page, exc)
                break
