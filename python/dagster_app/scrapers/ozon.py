from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://ozon.uz"


class OzonScraper(BaseScraper):
    store_name = "ozon"

    def _parse_price(self, text: str) -> float:
        nums = re.sub(r"[^\d]", "", text)
        return float(nums) if nums else 0.0

    def scrape(self) -> Iterator[ProductRow]:
        # Ozon Uzbekistan — try category page (may be JS-rendered)
        for slug in (
            "category/smartfony-15502/",
            "category/smartfony-portativnaya-elektronika-15502/",
            "search/?text=smartfon",
        ):
            page = 1
            found_any = False
            while page <= 15:
                try:
                    sep = "&" if "?" in slug else "?"
                    resp = self.get(f"{BASE}/{slug}{sep}page={page}")
                    if resp.status_code in (404, 403):
                        break
                    soup = BeautifulSoup(resp.text, "lxml")

                    cards = soup.select(
                        "[class*='tile-root'], [class*='product-tile'], "
                        "[data-widget='searchResultsV2'] > div, "
                        "[class*='tileHoverTarget']"
                    )
                    if not cards:
                        break

                    for card in cards:
                        found_any = True
                        title_el = card.select_one("[class*='tile-name'], span[class*='tsBody'], a span")
                        if not title_el:
                            continue
                        title = title_el.get_text(strip=True)

                        price_el = card.select_one("[class*='price'], span[class*='price']")
                        price = self._parse_price(price_el.get_text() if price_el else "0")

                        img_el = card.select_one("img")
                        image = img_el.get("src") or "" if img_el else ""

                        a_el = card.select_one("a[href]")
                        href = a_el.get("href", "") if a_el else ""
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
                    logger.warning(f"[ozon] /{slug} page {page} error: {exc}")
                    break
                page += 1
            if found_any:
                break
