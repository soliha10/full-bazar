from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://asaxiy.uz"

# Ilgari qidiruv ishlatilardi: `/product?key=smartfon&display=40&page=N`.
# Ikkita muammo bor edi:
#   1. Sahifa raqami QUERY da emas, YO'LDA bo'lishi kerak ekan
#      (`/product/page=2?...`). Shuning uchun `?page=N` e'tiborga olinmay,
#      har safar birinchi sahifa qaytardi — CSV ga 15 marta takrorlangan
#      bir xil 23 ta mahsulot yozilardi.
#   2. Qidiruv natijasi kategoriyadan tor: 151 ta mahsulot, kategoriyada 219 ta.
CATEGORY = "/product/telefony-i-gadzhety/telefony/smartfony"


def _first_number(text: str) -> float:
    """Extract the first integer run from a string (handles installment text like 'x 12 oy')."""
    m = re.search(r"[\d\s]+", text)
    if not m:
        return 0.0
    digits = re.sub(r"\s", "", m.group())
    return float(digits) if digits else 0.0


class AsaxiyScraper(BaseScraper):
    store_name = "asaxiy"

    MAX_PAGES = 40

    def scrape(self) -> Iterator[ProductRow]:
        seen: set[str] = set()

        for page in range(1, self.MAX_PAGES + 1):
            url = BASE + CATEGORY if page == 1 else f"{BASE}{CATEGORY}/page={page}"
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

                new_on_page = 0
                for el in cards:
                    href = el["href"]
                    if href in seen:
                        continue

                    name_el = el.select_one('[class*=name]')
                    title = name_el.get_text(strip=True) if name_el else ""
                    if not title:
                        continue

                    seen.add(href)
                    new_on_page += 1

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

                # Oxirgi sahifadan keyin asaxiy yana birinchi sahifani beradi —
                # yangi mahsulot chiqmasa, aylanishni to'xtatamiz.
                if new_on_page == 0:
                    logger.info(f"[asaxiy] page {page}: yangi mahsulot yo'q, to'xtatildi")
                    break

            except Exception as exc:
                logger.warning(f"[asaxiy] page {page} error: {exc}")
                break
