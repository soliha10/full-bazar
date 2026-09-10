from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

# Sayt Nuxt SPA ga o'tdi: katalog sahifasi serverdan faqat birinchi 20 ta
# kartani beradi va `?page=2` e'tiborga olinmaydi — qolgani brauzerda
# yuklanadi. Shuning uchun HTML o'rniga saytning o'z JSON API si o'qiladi.
API = "https://api.joybox.uz/api/v1/shop/products"
CATEGORY_SLUG = "smartfony"
PRODUCT_BASE = "https://joybox.uz/product"

# API narxni tiyinda qaytaradi (329900000 = 3 299 000 so'm)
PRICE_DIVISOR = 100


class JoyboxScraper(BaseScraper):
    store_name = "joybox"

    PAGE_LIMIT = 60
    MAX_PAGES = 40

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= self.MAX_PAGES:
            url = (f"{API}?categorySlug={CATEGORY_SLUG}"
                   f"&page={page}&limit={self.PAGE_LIMIT}")
            try:
                resp = self.get(url, json_mode=True)
                if not resp.ok:
                    logger.warning("[joybox] page %d HTTP %d", page, resp.status_code)
                    break

                payload = resp.json().get("data") or {}
                items = payload.get("items") or []
                if not items:
                    logger.info("[joybox] page %d: mahsulot yo'q, to'xtatildi", page)
                    break

                for item in items:
                    title = (item.get("name") or "").strip()
                    if not title:
                        continue

                    # salePrice — chegirmadagi joriy narx; bo'lmasa oddiy narx.
                    raw = item.get("salePrice") or item.get("price") or 0
                    price = float(raw) / PRICE_DIVISOR
                    if price <= 0:
                        continue

                    # Sotuvda yo'q mahsulotning narxi solishtirishga yaramaydi
                    if item.get("inStock") is False:
                        continue

                    slug = item.get("slug") or ""
                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=item.get("imageUrl") or "",
                        product_url=f"{PRODUCT_BASE}/{slug}/" if slug else "",
                    )

                meta = payload.get("meta") or {}
                if page >= (meta.get("totalPages") or page):
                    break

            except Exception as exc:
                logger.warning("[joybox] page %d error: %s", page, exc)
                break

            page += 1
