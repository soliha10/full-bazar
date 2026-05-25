from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

_SEARCH_URL = "https://search.wb.ru/exactmatch/ru/common/v7/search"
_QUERIES = ["смартфон", "iphone", "samsung galaxy", "xiaomi redmi", "honor smartphone"]


def _wb_image(product_id: int) -> str:
    vol = product_id // 100_000
    part = product_id // 1_000
    if vol <= 143:
        n = 1
    elif vol <= 287:
        n = 2
    elif vol <= 431:
        n = 3
    elif vol <= 719:
        n = 4
    elif vol <= 1007:
        n = 5
    elif vol <= 1061:
        n = 6
    elif vol <= 1115:
        n = 7
    elif vol <= 1169:
        n = 8
    elif vol <= 1313:
        n = 9
    elif vol <= 1601:
        n = 10
    elif vol <= 1655:
        n = 11
    elif vol <= 1919:
        n = 12
    else:
        n = 13
    return f"https://basket-{n:02d}.wbbasket.ru/vol{vol}/part{part}/{product_id}/images/big/1.jpg"


class WildberriesScraper(BaseScraper):
    store_name = "wildberries"

    def scrape(self) -> Iterator[ProductRow]:
        seen_ids: set[int] = set()

        for query in _QUERIES:
            for page in range(1, 6):
                try:
                    params = {
                        "query": query,
                        "resultset": "catalog",
                        "limit": 100,
                        "sort": "popular",
                        "page": page,
                        "appType": 1,
                        "curr": "uzs",
                        "lang": "uz",
                        "dest": -1257786,
                    }
                    resp = self.get(
                        _SEARCH_URL,
                        json_mode=True,
                        params=params,
                        headers={
                            "User-Agent": (
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                "AppleWebKit/537.36 (KHTML, like Gecko) "
                                "Chrome/124.0.0.0 Safari/537.36"
                            ),
                            "Accept": "application/json, text/plain, */*",
                            "Origin": "https://www.wildberries.uz",
                            "Referer": "https://www.wildberries.uz/",
                        },
                    )
                    if not resp.ok:
                        logger.warning(
                            f"[wildberries] query='{query}' page={page} HTTP {resp.status_code}"
                        )
                        break

                    data = resp.json()
                    products = (
                        data.get("data", {}).get("products", [])
                        or data.get("catalog", {}).get("products", [])
                        or []
                    )
                    if not products:
                        break

                    for p in products:
                        pid = p.get("id")
                        if not pid or pid in seen_ids:
                            continue
                        seen_ids.add(pid)

                        name = (p.get("name") or "").strip()
                        if not name:
                            continue

                        # WB returns prices in minor units (1/100 of currency)
                        raw_price = p.get("salePriceU") or p.get("priceU") or 0
                        price = float(raw_price) / 100.0 if raw_price else 0.0
                        if price < 100_000:
                            continue

                        yield ProductRow(
                            title=name,
                            price=price,
                            store=self.store_name,
                            image_url=_wb_image(pid),
                            product_url=f"https://www.wildberries.uz/catalog/{pid}/detail.aspx",
                            rating=str(p.get("rating") or p.get("reviewRating") or ""),
                            review_count=str(p.get("feedbacks") or p.get("reviewCount") or ""),
                        )

                except Exception as exc:
                    logger.warning(f"[wildberries] query='{query}' page={page} error: {exc}")
                    break
