from __future__ import annotations

import json
import logging
import re
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://castore.uz"

# Bitrix katalogi sahifani `PAGEN_2` bilan almashtiradi. Ilgari `PAGEN_1`
# ishlatilardi — u e'tiborga olinmay, 20 sahifa davomida bir xil birinchi
# sahifa qayta-qayta yozilardi (300 qator, atigi 2 ta unikal havola).
CATEGORY = f"{BASE}/vse-smartfony/"
PAGE_PARAM = "PAGEN_2"
MAX_PAGES = 40

# ── Nega BeautifulSoup emas ──────────────────────────────────────────────────
# Sahifaning HTML i noto'g'ri yopilgan teglarga to'la: lxml ham, html.parser
# ham barcha mahsulot kartalarini BITTA `<div>` ichiga yig'ib qo'yadi. Shu
# sababli "kartani top, ichidan nom va havolani ol" usuli ishlamaydi — har
# 20 ta mahsulotga bir xil havola tegib qolardi (eski koddagi xato).
#
# Sahifada esa ikkita ishonchli, TARTIBLI ro'yxat bor:
#   · GTM skriptlaridagi `position` bilan raqamlangan mahsulotlar (nom, narx)
#   · `/product/...` havolalari — xuddi shu tartibda
# Ularni tartib bo'yicha juftlaymiz va sonlari mos kelmasa sahifani tashlaymiz.
_GTM_RE  = re.compile(r'<script[^>]*js_gtm_data[^>]*>(.*?)</script>', re.S)
_HREF_RE = re.compile(r'href="(/product/[^"]+)"')
_IMG_RE  = re.compile(r'(/upload/[^"\']+?\.(?:jpg|jpeg|png|webp))', re.I)

# Karta rasmi havoladan keyingi shuncha belgida turadi
_IMG_LOOKAHEAD = 6000


def _gtm_products(html: str) -> list[dict]:
    products: list[dict] = []
    for match in _GTM_RE.finditer(html):
        try:
            data = json.loads(match.group(1))
        except (json.JSONDecodeError, TypeError):
            continue
        products.extend(
            data.get("ecommerce", {}).get("click", {}).get("products", [])
        )
    products.sort(key=lambda p: p.get("position") or 0)
    return products


def _product_links(html: str) -> list[tuple[str, int]]:
    """[(href, havoladan keyingi o'rin)] — sahifadagi tartibda, takrorsiz."""
    links: list[tuple[str, int]] = []
    seen: set[str] = set()
    for match in _HREF_RE.finditer(html):
        href = match.group(1)
        if href in seen:
            continue
        seen.add(href)
        links.append((href, match.end()))
    return links


class CastoreScraper(BaseScraper):
    store_name = "castore"

    def scrape(self) -> Iterator[ProductRow]:
        seen: set[str] = set()

        for page in range(1, MAX_PAGES + 1):
            url = f"{CATEGORY}?{PAGE_PARAM}={page}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.info("[castore] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                html = resp.text
                products = _gtm_products(html)
                links = _product_links(html)

                if not products or not links:
                    logger.info("[castore] page %d: mahsulot yo'q, to'xtatildi", page)
                    break

                if len(products) != len(links):
                    # Juftlash faqat sonlar teng bo'lgandagina ishonchli.
                    # Aks holda nom boshqa mahsulotning havolasiga tegib ketadi —
                    # narx solishtiruvchi sayt uchun bu jimgina yolg'on.
                    logger.warning(
                        "[castore] page %d: %d ta nom, %d ta havola — sahifa tashlab yuborildi",
                        page, len(products), len(links),
                    )
                    continue

                new_on_page = 0
                for product, (href, after) in zip(products, links):
                    title = (product.get("name") or "").strip()
                    if not title or href in seen:
                        continue

                    try:
                        price = float(str(product.get("price", 0)).replace(" ", "").replace(",", ""))
                    except (ValueError, TypeError):
                        price = 0.0
                    if not price:
                        continue

                    seen.add(href)
                    new_on_page += 1

                    img = _IMG_RE.search(html[after:after + _IMG_LOOKAHEAD])
                    image = BASE + img.group(1) if img else ""

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=image,
                        product_url=BASE + href,
                    )

                if new_on_page == 0:
                    logger.info("[castore] page %d: yangi mahsulot yo'q, to'xtatildi", page)
                    break

            except Exception as exc:
                logger.warning("[castore] page %d error: %s", page, exc)
                break
