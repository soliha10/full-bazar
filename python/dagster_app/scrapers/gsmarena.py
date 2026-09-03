from __future__ import annotations

import logging
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.gsmarena.com"


class GsmarenaScraper(BaseScraper):
    """gsmarena.com — extracts smartphone listings (no price usually available on search page)."""
    store_name = "gsmarena"

    def scrape(self) -> Iterator[ProductRow]:
        # Scraping popular brand pages
        brand_urls = [
            "samsung-phones-9.php",
            "apple-phones-48.php",
            "xiaomi-phones-80.php",
            "huawei-phones-58.php",
            "nokia-phones-1.php",
        ]
        
        for brand_url in brand_urls:
            url = f"{BASE}/{brand_url}"

            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[gsmarena] %s HTTP %d", brand_url, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select(".makers ul li")
                if not cards:
                    logger.info("[gsmarena] %s: no cards, stopping", brand_url)
                    break

                for card in cards:
                    a_el = card.find("a", href=True)
                    if not a_el:
                        continue

                    # Title is usually in span or strong inside the link, or in the img title
                    name_el = a_el.find("span") or a_el.find("strong")
                    title = name_el.get_text(separator=" ", strip=True) if name_el else ""

                    img = a_el.find("img")
                    if not title and img:
                        title = img.get("title") or img.get("alt") or ""
                    
                    if not title:
                        continue

                    # Extract image
                    src = img.get("src") if img else ""

                    # Link
                    href = a_el["href"]
                    product_url = href if href.startswith("http") else f"{BASE}/{href}"

                    # Price is not readily available on the GSMArena search listing
                    price = 1.0

                    yield ProductRow(
                        title=title, 
                        price=price, 
                        store=self.store_name,
                        image_url=src, 
                        product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[gsmarena] %s error: %s", brand_url, exc)
                break
