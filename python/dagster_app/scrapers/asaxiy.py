from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://asaxiy.uz"


def _first_number(text: str) -> float:
    """Extract the first integer run from a string (handles installment text like 'x 12 oy')."""
    m = re.search(r"[\d\s]+", text)
    if not m:
        return 0.0
    digits = re.sub(r"\s", "", m.group())
    return float(digits) if digits else 0.0


class AsaxiyScraper(BaseScraper):
    store_name = "asaxiy"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 15:
            url = f"{BASE}/product?key=smartfon&display=40&page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning(f"[asaxiy] page {page} HTTP {resp.status_code}, stopping")
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                container = soup.select_one(".loading-more-product-list")
                if not container:
                    logger.warning(f"[asaxiy] page {page}: container not found, stopping")
                    break

                # All <a> tags inside container whose href contains /product/
                # but excludes /compare and /wishlist paths
                cards = [
                    a for a in container.find_all("a", href=True)
                    if "/product/" in a["href"]
                    and "/compare" not in a["href"]
                    and "/wishlist" not in a["href"]
                ]

                if not cards:
                    logger.info(f"[asaxiy] page {page}: no cards found, stopping")
                    break

                for el in cards:
                    name_el = el.select_one('[class*=name]')
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = el.select_one('[class*=price]')
                    price_text = price_el.get_text(separator=" ", strip=True) if price_el else ""
                    price = _first_number(price_text)

                    # Image: find img whose src starts with the CDN domain; skip SVG/icon placeholders
                    image = ""
                    for img in el.find_all("img"):
                        src = img.get("src") or img.get("data-src") or ""
                        if src.startswith("https://cdn.asaxiy.uz"):
                            image = src
                            break

                    href = el["href"]
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
                logger.warning(f"[asaxiy] page {page} error: {exc}")
                break

            page += 1
