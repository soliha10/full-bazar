from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

# Do'kon macbro.uz dan mcbro.uz ga ko'chgan; eski domen faqat yo'naltiradi va
# `/collections/smartfony` u yerda 404 qaytaradi. Telefonlar bo'limi endi
# "mobilynie-telefoni" deb ataladi, brend bo'limlari esa alohida turadi.
BASE = "https://mcbro.uz"
COLLECTIONS = [
    "mobilynie-telefoni",
    "smartfony-apple",
    "smartfony-samsung",
]


def _price(text: str) -> float:
    nums = re.sub(r"[^\d]", "", text or "")
    return float(nums) if nums else 0.0


class MacbroScraper(BaseScraper):
    store_name = "macbro"

    MAX_PAGES = 15

    def scrape(self) -> Iterator[ProductRow]:
        seen: set[str] = set()
        for collection in COLLECTIONS:
            yield from self._scrape_collection(collection, seen)

    def _scrape_collection(self, collection: str, seen: set[str]) -> Iterator[ProductRow]:
        for page in range(1, self.MAX_PAGES + 1):
            url = f"{BASE}/collections/{collection}"
            if page > 1:
                url += f"?page={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[macbro] %s page %d HTTP %d", collection, page, resp.status_code)
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                cards = soup.select("product-card")
                if not cards:
                    logger.info("[macbro] %s page %d: karta yo'q, to'xtatildi", collection, page)
                    break

                new_on_page = 0
                for card in cards:
                    a_el = card.select_one("a.product-card-title[href]") or card.find("a", href=True)
                    if not a_el:
                        continue
                    title = (a_el.get("title") or a_el.get_text(strip=True) or "").strip()
                    href = a_el["href"]
                    if not title or href in seen:
                        continue

                    # Chegirmadagi narx <ins> ichida, eskisi <del> da — joriy
                    # narx kerak, shuning uchun avval <ins> qaraladi.
                    price_el = (card.select_one(".price ins .amount")
                                or card.select_one(".price .amount"))
                    price = _price(price_el.get_text() if price_el else "")
                    if not price:
                        continue

                    seen.add(href)
                    new_on_page += 1

                    img = card.select_one("img.product-primary-image") or card.find("img")
                    src = ""
                    if img:
                        # src — 20px placeholder; haqiqiy rasm data-srcset da.
                        srcset = img.get("data-srcset") or img.get("srcset") or ""
                        if srcset:
                            src = srcset.split(",")[-1].strip().split(" ")[0]
                        else:
                            src = img.get("data-src") or img.get("src") or ""
                        if src.startswith("//"):
                            src = "https:" + src
                        elif src and not src.startswith("http"):
                            src = BASE + src

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=src,
                        product_url=href if href.startswith("http") else BASE + href,
                    )

                # Shopify oxirgi sahifadan keyin ham bir xil ro'yxatni qaytarishi
                # mumkin — yangi mahsulot qo'shilmasa, aylanishni to'xtatamiz.
                if new_on_page == 0:
                    break

            except Exception as exc:
                logger.warning("[macbro] %s page %d error: %s", collection, page, exc)
                break
