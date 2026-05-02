from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://texnomart.uz"


def _first_number(text: str) -> float:
    """Extract the first integer run from a string, stripping so'm and spaces."""
    nums = re.sub(r"[^\d]", "", text.split("so'm")[0])
    return float(nums) if nums else 0.0


class TexnomartScraper(BaseScraper):
    store_name = "texnomart"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 20:
            url = f"{BASE}/katalog/smartfony/?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning(f"[texnomart] page {page} HTTP {resp.status_code}, stopping")
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(".product-item-wrapper")
                if len(cards) < 5:
                    logger.info(f"[texnomart] page {page}: only {len(cards)} cards, stopping")
                    break

                for card in cards:
                    name_el = card.select_one(".product-name")
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    price_el = card.select_one(".product-price-wrap-2")
                    price_text = price_el.get_text(separator=" ", strip=True) if price_el else ""
                    price = _first_number(price_text)

                    # Image: find img whose alt equals product name (real product image, not SVG sticker)
                    image = ""
                    for img in card.find_all("img"):
                        alt = (img.get("alt") or "").strip()
                        src = img.get("src") or img.get("data-src") or ""
                        if alt and alt == title and src and not src.endswith(".svg"):
                            image = src
                            break
                    # Fallback: first img with a non-SVG src
                    if not image:
                        for img in card.find_all("img"):
                            src = img.get("src") or img.get("data-src") or ""
                            if src and not src.endswith(".svg"):
                                image = src
                                break
                    if image and not image.startswith("http"):
                        image = BASE + image

                    # URL: first <a> tag in card
                    a_el = card.find("a", href=True)
                    href = a_el["href"] if a_el else ""
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
                logger.warning(f"[texnomart] page {page} error: {exc}")
                break

            page += 1
