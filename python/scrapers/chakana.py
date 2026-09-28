from __future__ import annotations

import json
import logging
import subprocess
import time
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://chakana.uz"
API_BASE = "https://api.chakana.uz"
# Category 229 = Смартфоны и мобильные телефоны
CATEGORY_ID = 229


def _curl_json(url: str, delay: float = 1.0) -> list | dict | None:
    """Fetch JSON via curl (works with TLS 1.3 unlike macOS LibreSSL 2.8.3)."""
    time.sleep(delay)
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", "15", "-H", "Accept: application/json", url],
            capture_output=True, text=True, timeout=20,
        )
        if not r.stdout.strip():
            logger.warning("[chakana] curl bo'sh javob qaytardi (exit %d): %s",
                           r.returncode, (r.stderr or "").strip()[:200])
            return None
        return json.loads(r.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as exc:
        logger.warning("[chakana] curl xatoligi: %r", exc)
        return None


class ChakanaScraper(BaseScraper):
    """chakana.uz — uses https://api.chakana.uz REST API (JSON, no browser needed)."""
    store_name = "chakana"

    def scrape(self) -> Iterator[ProductRow]:
        for page in range(1, 50):
            url = f"{API_BASE}/v1/product/by-category?id={CATEGORY_ID}&page={page}&limit=100"
            try:
                # Try requests first (works in Docker/Linux with OpenSSL)
                resp = self.get(url, json_mode=True)
                if resp.ok:
                    products = resp.json()
                else:
                    raise ValueError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as exc:
                # Fallback: use curl (handles TLS 1.3 on macOS)
                logger.warning("[chakana] page %d requests bilan olinmadi (%s), "
                               "curl ga o'tilmoqda", page, exc)
                products = _curl_json(url, delay=self.delay)

            if not isinstance(products, list) or not products:
                # Ilgari bu "no products" deb INFO bilan yozilardi va CI da
                # chakana jimgina 0 ta mahsulot berardi — sabab ko'rinmasdi.
                # Birinchi sahifadayoq bo'sh qolish — bu xato, oxir emas.
                level = logger.warning if page == 1 else logger.info
                level("[chakana] page %d: mahsulot qaytmadi (javob turi: %s), "
                      "to'xtatildi", page, type(products).__name__)
                break

            for prod in products:
                name = (prod.get("name_ru") or prod.get("name") or "").strip()
                if not name:
                    continue

                price = float(prod.get("price_full") or prod.get("offer", {}).get("price") or 0)
                if not price:
                    continue

                image_url = prod.get("image") or ""
                product_id = prod.get("id") or ""
                product_url = f"{BASE}/uz/product/{product_id}" if product_id else ""

                rating_data = prod.get("product_rating") or {}
                rating = str(rating_data.get("total_rating", "")) if rating_data else ""
                reviews = str(rating_data.get("count_rating", "")) if rating_data else ""

                yield ProductRow(
                    title=name,
                    price=price,
                    store=self.store_name,
                    image_url=image_url,
                    product_url=product_url,
                    rating=rating,
                    review_count=reviews,
                )

            logger.info("[chakana] page %d: %d products", page, len(products))
