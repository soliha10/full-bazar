from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://glotr.uz"


def _first_number(text: str) -> float:
    """Extract the first run of digits from a string."""
    m = re.search(r"\d[\d\s]*", text)
    if not m:
        return 0.0
    digits = re.sub(r"\s", "", m.group())
    return float(digits) if digits else 0.0


class GlotrScraper(BaseScraper):
    store_name = "glotr"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 10:
            url = f"{BASE}/smartfoni/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning(f"[glotr] page {page} HTTP {resp.status_code}, stopping")
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(".product-card")
                if not cards:
                    logger.info(f"[glotr] page {page}: no cards found, stopping")
                    break

                for card in cards:
                    # Name: link text inside .product-card__content
                    content = card.select_one(".product-card__content")
                    name_el = content.select_one(".product-card__link") if content else None
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    # Price: .price-retail.proposal-price
                    price_el = card.select_one(".price-retail.proposal-price")
                    price_text = price_el.get_text(separator=" ", strip=True) if price_el else ""
                    price = _first_number(price_text)

                    # Image: img.lazyload-img[data-src] inside .product-card__header
                    image = ""
                    header = card.select_one(".product-card__header")
                    if header:
                        img = header.select_one("img.lazyload-img[data-src]")
                        if img:
                            src = img.get("data-src", "")
                            if src.startswith("https://"):
                                image = src

                    # URL: href from .product-card__link
                    link_el = card.select_one(".product-card__link")
                    href = link_el.get("href", "") if link_el else ""
                    product_url = href if href.startswith("http") else BASE + href

                    # Rating: span inside .product_company_rating
                    rating = ""
                    rating_el = card.select_one(".product_company_rating")
                    if rating_el:
                        span = rating_el.find("span")
                        if span:
                            rating = span.get_text(strip=True)

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=image,
                        product_url=product_url,
                        rating=rating,
                        review_count="",
                    )

            except Exception as exc:
                logger.warning(f"[glotr] page {page} error: {exc}")
                break

            page += 1
