from __future__ import annotations

import csv
import logging
import os
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterator

import requests

logger = logging.getLogger(__name__)

CSV_FIELDS = ["title", "price", "store", "image_url", "product_url", "rating", "review_count"]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "uz-UZ,uz;q=0.9,ru;q=0.8,en-US;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

JSON_HEADERS = {
    **HEADERS,
    "Accept": "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
}


@dataclass
class ProductRow:
    title: str
    price: float
    store: str
    image_url: str = ""
    product_url: str = ""
    rating: str = ""
    review_count: str = ""


class BaseScraper(ABC):
    store_name: str

    def __init__(self, output_dir: str, delay: float = 1.5):
        self.output_dir = output_dir
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    @abstractmethod
    def scrape(self) -> Iterator[ProductRow]:
        pass

    def get(self, url: str, json_mode: bool = False, **kwargs) -> requests.Response:
        time.sleep(self.delay + random.uniform(0, 0.5))
        if json_mode:
            kwargs.setdefault("headers", JSON_HEADERS)
        return self.session.get(url, timeout=20, **kwargs)

    def run(self) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        filepath = os.path.join(self.output_dir, f"{self.store_name}_products.csv")
        count = 0
        try:
            with open(filepath, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
                writer.writeheader()
                for row in self.scrape():
                    if not row.title or not row.price:
                        continue
                    writer.writerow({
                        "title": row.title,
                        "price": row.price,
                        "store": row.store or self.store_name,
                        "image_url": row.image_url,
                        "product_url": row.product_url,
                        "rating": row.rating,
                        "review_count": row.review_count,
                    })
                    count += 1
        except Exception as exc:
            logger.error(f"[{self.store_name}] Fatal: {exc}")
        logger.info(f"[{self.store_name}] Saved {count} products → {filepath}")
        return count
