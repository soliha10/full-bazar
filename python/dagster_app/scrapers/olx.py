from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.olx.uz"

# Only include listings that look like new/store sales (skip very cheap used items)
MIN_PRICE = 500_000


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


class OlxScraper(BaseScraper):
    """olx.uz — classifieds. Only scrapes new smartphone listings (price > 500k)."""
    store_name = "olx"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 15):
            url = f"{BASE}/q/smartfon/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[olx] page %d HTTP %d", page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                # OLX listing cards
                cards = soup.select(
                    "[data-cy='l-card'], .offer-wrapper, "
                    "[class*='css-'][class*='offer'], li[class*='offer']"
                )
                if not cards:
                    logger.info("[olx] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    name_el = card.select_one(
                        "h6, h4, [class*='title'], [data-cy='ad-card-title']"
                    )
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue
                    # Filter: must look like a smartphone listing
                    title_lower = title.lower()
                    if not any(kw in title_lower for kw in [
                        "iphone", "samsung", "xiaomi", "redmi", "realme",
                        "oppo", "vivo", "huawei", "honor", "pixel", "nothing",
                        "smartfon", "telefon", "phone", "galaxy"
                    ]):
                        continue

                    price_el = card.select_one(
                        "[data-testid='ad-price'], [class*='price'], p[class*='price']"
                    )
                    price = _price(price_el.get_text() if price_el else "")
                    # Skip cheap used items
                    if price < MIN_PRICE:
                        continue

                    img = card.find("img")
                    src = (img.get("src") or img.get("data-src") or "") if img else ""

                    a_el = card.find("a", href=True)
                    href = a_el["href"] if a_el else ""
                    product_url = href if href.startswith("http") else BASE + href

                    yield ProductRow(
                        title=title, price=price, store=self.store_name,
                        image_url=src, product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[olx] page %d error: %s", page, exc)
                break
