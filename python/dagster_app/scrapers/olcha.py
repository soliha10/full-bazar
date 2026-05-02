from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://olcha.uz"
CATEGORY_URL = f"{BASE}/ru/category/telefony-gadzhety-aksessuary/telefony"


def _first_number(text: str) -> float:
    """Extract the first run of digits from a string."""
    m = re.search(r"\d[\d\s]*", text)
    if not m:
        return 0.0
    digits = re.sub(r"\s", "", m.group())
    return float(digits) if digits else 0.0


class OlchaScraper(BaseScraper):
    store_name = "olcha"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 30:
            url = f"{CATEGORY_URL}?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning(f"[olcha] page {page} HTTP {resp.status_code}, stopping")
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                catalog = soup.select_one(".all-products-catalog__content")
                cards = (catalog or soup).select(".product-card")

                if not cards:
                    logger.info(f"[olcha] page {page}: no cards found, stopping")
                    break

                for card in cards:
                    name_el = card.select_one(".product-card__brand-name")
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = card.select_one(".price__main")
                    price_text = price_el.get_text(separator=" ", strip=True) if price_el else ""
                    price = _first_number(price_text)

                    # Images are lazy-loaded base64 placeholders — skip
                    image = ""

                    a_el = card.select_one("a.product-card__link")
                    href = a_el["href"] if a_el and a_el.get("href") else ""
                    product_url = href if href.startswith("http") else BASE + href

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=image,
                        product_url=product_url,
                        rating="",
                        review_count="",
                    )

            except Exception as exc:
                logger.warning(f"[olcha] page {page} error: {exc}")
                break

            page += 1
