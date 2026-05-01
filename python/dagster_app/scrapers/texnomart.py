from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.texnomart.uz"


class TexnomartScraper(BaseScraper):
    store_name = "texnomart"

    def _parse_price(self, text: str) -> float:
        nums = re.sub(r"[^\d]", "", text)
        return float(nums) if nums else 0.0

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 20:
            try:
                resp = self.get(f"{BASE}/catalog/smartfony", params={"page": page})
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(".product-item, .product_item, [class*='product-card'], [class*='item-product']")
                if not cards:
                    # try alternative selectors
                    cards = soup.select("article.item, .catalog-item, li.product")
                if not cards:
                    break

                for card in cards:
                    title_el = card.select_one("a.product-name, .item-title, h3 a, .product_name, [class*='name'] a")
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)

                    price_el = card.select_one(".product-price, .price, [class*='price']")
                    price_text = price_el.get_text(strip=True) if price_el else "0"
                    price = self._parse_price(price_text)

                    img_el = card.select_one("img")
                    image = img_el.get("data-src") or img_el.get("src") or "" if img_el else ""
                    if image and not image.startswith("http"):
                        image = BASE + image

                    href = title_el.get("href", "")
                    url = href if href.startswith("http") else BASE + href

                    rating_el = card.select_one(".rating, [class*='star'], [class*='rating']")
                    rating = ""
                    if rating_el:
                        filled = rating_el.select("[class*='active'], [class*='filled'], [class*='full']")
                        rating = str(len(filled)) if filled else ""

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=image,
                        product_url=url,
                        rating=rating,
                        review_count="",
                    )

            except Exception as exc:
                logger.warning(f"[texnomart] page {page} error: {exc}")
                break
            page += 1
