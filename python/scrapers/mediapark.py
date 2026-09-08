from __future__ import annotations

import json
import logging
import subprocess
import time
from typing import Iterator
from urllib.parse import urlencode

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

API_URL = "https://api.client.mediapark.uz/v2/child-subcategory/meili-products-filter"
SUBCATEGORY_ID = 40  # smartfony-40 from navlinks
ITEMS_PER_PAGE = 10  # server-side fixed limit
MAX_PAGES = 100


def _curl_json(url: str, delay: float = 1.0) -> dict | None:
    """Fetch JSON via curl — works with TLS 1.3 on macOS LibreSSL 2.8.3."""
    time.sleep(delay)
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", "15",
             "-H", "Accept: application/json",
             "-H", "Origin: https://mediapark.uz",
             "-H", "User-Agent: Mozilla/5.0",
             url],
            capture_output=True, text=True, timeout=20,
        )
        if not r.stdout.strip():
            return None
        return json.loads(r.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        return None


class MediaparkScraper(BaseScraper):
    """Mediapark.uz — via internal API (TLS 1.3; uses curl subprocess on macOS)."""

    store_name = "mediapark"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, MAX_PAGES + 1):
            qs = urlencode({"subcategory_id": SUBCATEGORY_ID, "page": page, "perPage": ITEMS_PER_PAGE})
            url = f"{API_URL}?{qs}"

            data = _curl_json(url, delay=self.delay)
            if not data:
                logger.warning("[mediapark] page %d: empty response, stopping", page)
                break

            products = (data.get("data") or {}).get("products", [])
            if not products:
                logger.info("[mediapark] page %d: no products, stopping", page)
                break

            for item in products:
                name = (item.get("name") or {}).get("ru") or (item.get("name") or {}).get("uz", "")
                if not name:
                    continue

                price = item.get("actual_price") or item.get("core_price") or 0
                if not price:
                    continue

                photos = item.get("mobile_photos") or item.get("photos") or []
                image_url = photos[0] if photos else ""

                slug = (item.get("url_slug") or {}).get("ru", "")
                product_url = f"https://mediapark.uz/ru/product/{slug}" if slug else ""

                yield ProductRow(
                    title=name,
                    price=float(price),
                    store=self.store_name,
                    image_url=image_url,
                    product_url=product_url,
                )

            logger.info("[mediapark] page %d: %d products", page, len(products))

            if len(products) < ITEMS_PER_PAGE:
                break
