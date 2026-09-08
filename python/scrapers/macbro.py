from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://macbro.uz"


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text)
    return float(nums) if nums else 0.0


CATEGORY = f"{BASE}/collections/smartfony"


class MacbroScraper(BaseScraper):
    store_name = "macbro"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 15):
            url = f"{CATEGORY}?page={page}" if page > 1 else CATEGORY
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[macbro] page %d HTTP %d, stopping", page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select("product-card")
                if not cards:
                    logger.info("[macbro] page %d: no cards, stopping", page)
                    break

                for card in cards:
                    a_el = card.find("a", title=True)
                    title = (a_el.get("title") or "").strip() if a_el else ""
                    if not title:
                        continue

                    # Price is in <ins><span class="amount">X сум</span></ins>
                    price_el = card.select_one("ins .amount, .price ins, .amount")
                    price = _price(price_el.get_text() if price_el else "")
                    if not price:
                        continue

                    img = card.find("img", class_="lazyload") or card.find("img")
                    src = ""
                    if img:
                        src = img.get("data-src") or img.get("src") or ""
                        if src.startswith("//"):
                            src = "https:" + src
                        elif src and not src.startswith("http"):
                            src = BASE + src

                    href = a_el["href"] if a_el else ""
                    product_url = href if href.startswith("http") else BASE + href

                    yield ProductRow(
                        title=title, price=price, store=self.store_name,
                        image_url=src, product_url=product_url,
                    )

            except Exception as exc:
                logger.warning("[macbro] page %d error: %s", page, exc)
                break
