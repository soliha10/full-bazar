from __future__ import annotations

import logging
import re
import time
import random
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://www.prom.uz"
SECTION_URL = f"{BASE}/section/mobilnye-telefony-smartfony/"
MAX_PAGES = 60


def _parse_price(text: str) -> float:
    m = re.search(r"([\d\s]{4,20})сум", text)
    if not m:
        return 0.0
    return float(re.sub(r"\s", "", m.group(1)))


def _clean_name(text: str) -> str:
    # Name comes after 'мес' (installment marker) when present
    m = re.search(r"мес(.+)", text, re.S)
    if m:
        return m.group(1).strip()
    # Fallback: strip leading price+сум+noise
    cleaned = re.sub(r"^[\d\s]+сум[^\w]*", "", text).strip()
    return cleaned


class PromScraper(BaseScraper):
    """prom.uz — parses listing HTML; prices and names are rendered server-side."""
    store_name = "prom"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, MAX_PAGES + 1):
            url = f"{SECTION_URL}?page={page}" if page > 1 else SECTION_URL
            time.sleep(self.delay + random.uniform(0, 0.3))
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[prom] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                soup = BeautifulSoup(resp.text, "lxml")
                links = soup.find_all("a", href=re.compile(r"^/ads/"))
                if not links:
                    logger.info("[prom] page %d: no products, stopping", page)
                    break

                count = 0
                for a in links:
                    raw = a.get_text(separator=" ", strip=True)
                    price = _parse_price(raw)
                    name = _clean_name(raw)
                    if not price or not name or len(name) < 3:
                        continue

                    img_tag = a.find("img")
                    img_url = ""
                    if img_tag:
                        src = img_tag.get("src") or img_tag.get("data-src") or ""
                        # prom proxies images via _ipx — extract the original URL
                        orig = re.search(r"/(https?://[^\?]+)", src)
                        img_url = orig.group(1) if orig else src

                    yield ProductRow(
                        title=name,
                        price=price,
                        store=self.store_name,
                        image_url=img_url,
                        product_url=BASE + a["href"],
                    )
                    count += 1

                logger.info("[prom] page %d: %d products", page, count)

            except Exception as exc:
                logger.warning("[prom] page %d error: %s", page, exc)
                break
