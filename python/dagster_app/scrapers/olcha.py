from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://olcha.uz"


class OlchaScraper(BaseScraper):
    store_name = "olcha"

    def _parse_price(self, text: str) -> float:
        nums = re.sub(r"[^\d]", "", text)
        return float(nums) if nums else 0.0

    def scrape(self) -> Iterator[ProductRow]:
        for category_slug in ("smartfony-mobile-phones", "smartfonlar"):
            page = 1
            found_any = False
            while page <= 20:
                try:
                    resp = self.get(
                        f"{BASE}/category/{category_slug}",
                        params={"page": page},
                    )
                    soup = BeautifulSoup(resp.text, "lxml")

                    cards = soup.select(
                        ".product-card, .product_card, [class*='product-item'], "
                        "[class*='catalog-item'], .item.col"
                    )
                    if not cards:
                        break

                    for card in cards:
                        found_any = True
                        title_el = card.select_one("a[class*='name'], .product-name, h3 a, .item-name a")
                        if not title_el:
                            continue
                        title = title_el.get_text(strip=True)

                        price_el = card.select_one("[class*='price'], .price")
                        price = self._parse_price(price_el.get_text() if price_el else "0")

                        img_el = card.select_one("img")
                        image = ""
                        if img_el:
                            image = img_el.get("data-src") or img_el.get("src") or ""
                        if image and not image.startswith("http"):
                            image = BASE + image

                        href = title_el.get("href", "")
                        url = href if href.startswith("http") else BASE + href

                        yield ProductRow(
                            title=title,
                            price=price,
                            store=self.store_name,
                            image_url=image,
                            product_url=url,
                            rating="",
                            review_count="",
                        )

                except Exception as exc:
                    logger.warning(f"[olcha] {category_slug} page {page} error: {exc}")
                    break
                page += 1
            if found_any:
                break
