from __future__ import annotations

import json
import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://castore.uz"


class CastoreScraper(BaseScraper):
    store_name = "castore"

    def scrape(self) -> Iterator[ProductRow]:
        page = 1
        while page <= 20:
            url = f"{BASE}/vse-smartfony/?PAGEN_1={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning(f"[castore] page {page} HTTP {resp.status_code}, stopping")
                    break
                soup = BeautifulSoup(resp.text, "lxml")

                # Extract structured product data from GTM script tags
                gtm_products: list[dict] = []
                for script in soup.find_all("script", {"type": "text/gtm"}):
                    try:
                        data = json.loads(script.string or "")
                        items = (
                            data.get("ecommerce", {})
                                .get("click", {})
                                .get("products", [])
                        )
                        gtm_products.extend(items)
                    except (json.JSONDecodeError, AttributeError):
                        continue

                if not gtm_products:
                    logger.info(f"[castore] page {page}: 0 GTM products found, stopping")
                    break

                # Collect HTML cards to match images and URLs by position
                html_cards = soup.select(".catalog-section-cont-product")

                for idx, product in enumerate(gtm_products):
                    title = (product.get("name") or "").strip()
                    if not title:
                        continue

                    price_raw = product.get("price", 0)
                    try:
                        price = float(str(price_raw).replace(" ", "").replace(",", ""))
                    except (ValueError, TypeError):
                        price = 0.0

                    # Match corresponding HTML card by position for image and URL
                    image = ""
                    product_url = ""
                    if idx < len(html_cards):
                        card = html_cards[idx]

                        # Image: prefer any /upload/ path; skip resize_cache thumbnails if possible
                        for img in card.find_all("img", src=True):
                            src = img["src"]
                            if src and "/upload/" in src:
                                # Prefer full image over resize_cache thumbnail, but accept either
                                if not src.startswith("/upload/resize_cache"):
                                    image = BASE + src if src.startswith("/") else src
                                    break
                        if not image:
                            # Fallback: accept resize_cache too
                            for img in card.find_all("img", src=True):
                                src = img["src"]
                                if src and "/upload/" in src:
                                    image = BASE + src if src.startswith("/") else src
                                    break

                        a_el = card.find("a", href=True)
                        if a_el:
                            href = a_el["href"]
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
                logger.warning(f"[castore] page {page} error: {exc}")
                break

            page += 1
