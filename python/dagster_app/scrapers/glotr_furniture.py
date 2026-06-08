from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://glotr.uz"

FURNITURE_CATEGORIES = [
    "mebel",
    "divanlar",
    "krovat",
    "shkaflar",
    "stol-stullar",
]


def _first_number(text: str) -> float:
    m = re.search(r"\d[\d\s]*", text)
    if not m:
        return 0.0
    digits = re.sub(r"\s", "", m.group())
    return float(digits) if digits else 0.0


class GlotrFurnitureScraper(BaseScraper):
    store_name = "glotr_furniture"

    def scrape(self) -> Iterator[ProductRow]:
        for category in FURNITURE_CATEGORIES:
            page = 1
            while page <= 10:
                url = f"{BASE}/uz/{category}/?page={page}"
                try:
                    resp = self.get(url)
                    if not resp.ok:
                        logger.warning("[glotr_furniture] %s page %d HTTP %d", category, page, resp.status_code)
                        break
                    soup = BeautifulSoup(resp.text, "lxml")

                    cards = soup.select(".product-card")
                    if not cards:
                        logger.info("[glotr_furniture] %s page %d: no cards, stopping", category, page)
                        break

                    for card in cards:
                        content = card.select_one(".product-card__content")
                        name_el = content.select_one(".product-card__link") if content else None
                        title = name_el.get_text(strip=True) if name_el else ""
                        if not title:
                            continue

                        price_el = card.select_one(".price-retail.proposal-price")
                        price_text = price_el.get_text(separator=" ", strip=True) if price_el else ""
                        price = _first_number(price_text)
                        if price < 100_000:
                            continue

                        image = ""
                        header = card.select_one(".product-card__header")
                        if header:
                            img = header.select_one("img.lazyload-img[data-src]")
                            if img:
                                src = img.get("data-src", "")
                                if src.startswith("https://"):
                                    image = src

                        link_el = card.select_one(".product-card__link")
                        href = link_el.get("href", "") if link_el else ""
                        product_url = href if href.startswith("http") else BASE + href

                        rating = ""
                        rating_el = card.select_one(".product_company_rating")
                        if rating_el:
                            span = rating_el.find("span")
                            if span:
                                rating = span.get_text(strip=True)

                        yield ProductRow(
                            title=title,
                            price=price,
                            store="glotr",
                            image_url=image,
                            product_url=product_url,
                            rating=rating,
                            review_count="",
                        )

                except Exception as exc:
                    logger.warning("[glotr_furniture] %s page %d error: %s", category, page, exc)
                    break

                page += 1
