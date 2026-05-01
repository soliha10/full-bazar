from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://glotr.uz"


class GlotrScraper(BaseScraper):
    store_name = "glotr"

    def _parse_price(self, text: str) -> float:
        nums = re.sub(r"[^\d]", "", text)
        return float(nums) if nums else 0.0

    def scrape(self) -> Iterator[ProductRow]:
        for slug in ("catalog/smartfony", "search?q=smartfon", "category/smartfonlar"):
            page = 1
            found_any = False
            while page <= 20:
                try:
                    sep = "&" if "?" in slug else "?"
                    resp = self.get(f"{BASE}/{slug}{sep}page={page}")
                    if resp.status_code == 404:
                        break
                    soup = BeautifulSoup(resp.text, "lxml")

                    cards = soup.select(
                        ".product-item, [class*='product-card'], .catalog-item, "
                        "[class*='item-product'], li.product, .good-item"
                    )
                    if not cards:
                        break

                    for card in cards:
                        found_any = True
                        title_el = card.select_one(
                            "a[class*='name'], .product-name, .item-name a, h3 a, h2 a"
                        )
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
                    logger.warning(f"[glotr] /{slug} page {page} error: {exc}")
                    break
                page += 1
            if found_any:
                break
