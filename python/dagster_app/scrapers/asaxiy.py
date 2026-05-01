from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://asaxiy.uz"


class AsaxiyScraper(BaseScraper):
    store_name = "asaxiy"

    def scrape(self) -> Iterator[ProductRow]:
        # Asaxiy exposes a paginated JSON product API
        page = 1
        empty_streak = 0
        while page <= 25:
            try:
                resp = self.get(
                    f"{BASE}/product",
                    json_mode=True,
                    params={"key": "smartfon", "display": 40, "page": page, "order": "hit_count"},
                )
                data = resp.json()
                items = (
                    data.get("data", {}).get("items")
                    or data.get("items")
                    or data.get("products")
                    or []
                )
                if not items:
                    empty_streak += 1
                    if empty_streak >= 2:
                        break
                    page += 1
                    continue
                empty_streak = 0
                for item in items:
                    title = (
                        item.get("name") or item.get("title") or item.get("product_name") or ""
                    ).strip()
                    price = item.get("price") or item.get("current_price") or 0
                    image = item.get("image") or item.get("image_url") or item.get("img") or ""
                    if image and not image.startswith("http"):
                        image = f"https://assets.asaxiy.uz/product/main_image/desktop/{image}"
                    slug = item.get("slug") or item.get("seo_url") or ""
                    url = f"{BASE}/uz/product/{slug}" if slug else ""
                    yield ProductRow(
                        title=title,
                        price=float(str(price).replace(" ", "").replace(",", "") or 0),
                        store=self.store_name,
                        image_url=image,
                        product_url=url,
                        rating=str(item.get("rating") or item.get("avg_rating") or ""),
                        review_count=str(item.get("review_count") or item.get("reviews_count") or ""),
                    )
            except Exception as exc:
                logger.warning(f"[asaxiy] page {page} error: {exc}")
                if empty_streak >= 2:
                    break
            page += 1
