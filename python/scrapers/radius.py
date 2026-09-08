from __future__ import annotations

import json
import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://radius.uz"
GQL_URL = "https://new.api.radius.uz/graphql/"
# Base64 encoded Saleor ID: Category:2314 = Смартфоны (level 1)
CATEGORY_ID = "Q2F0ZWdvcnk6MjMxNA=="

QUERY = """
query Products($cursor: String) {
  products(first: 100, filter: {categories: ["%s"]}, after: $cursor) {
    edges {
      node {
        id
        name
        slug
        pricing {
          priceRange {
            start {
              amount
              currency
            }
          }
        }
        media {
          url
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
""" % CATEGORY_ID


class RadiusScraper(BaseScraper):
    """radius.uz — Saleor-based platform with GraphQL API at new.api.radius.uz/graphql/."""
    store_name = "radius"

    def scrape(self) -> Iterator[ProductRow]:
        cursor = None
        page = 0

        while True:
            page += 1
            payload = {"query": QUERY, "variables": {"cursor": cursor}}
            try:
                resp = self.session.post(GQL_URL, json=payload, timeout=20)
                if not resp.ok:
                    logger.warning("[radius] page %d HTTP %d, stopping", page, resp.status_code)
                    break

                data = resp.json()
                if "errors" in data:
                    logger.warning("[radius] GraphQL errors: %s", data["errors"])
                    break

                products_conn = data.get("data", {}).get("products", {})
                edges = products_conn.get("edges", [])
                page_info = products_conn.get("pageInfo", {})

                if not edges:
                    logger.info("[radius] page %d: no products, stopping", page)
                    break

                for edge in edges:
                    node = edge.get("node", {})
                    name = node.get("name", "").strip()
                    if not name:
                        continue

                    pricing = node.get("pricing") or {}
                    price_range = pricing.get("priceRange") or {}
                    start = price_range.get("start") or {}
                    price = float(start.get("amount") or 0)
                    if not price:
                        continue

                    slug = node.get("slug") or ""
                    product_url = f"{BASE}/catalog/smartfony/{slug}" if slug else ""

                    media = node.get("media") or []
                    image_url = media[0]["url"] if media else ""

                    yield ProductRow(
                        title=name,
                        price=price,
                        store=self.store_name,
                        image_url=image_url,
                        product_url=product_url,
                    )

                logger.info("[radius] page %d: %d products", page, len(edges))

                if not page_info.get("hasNextPage"):
                    break
                cursor = page_info.get("endCursor")
                if not cursor:
                    break

            except Exception as exc:
                logger.warning("[radius] page %d error: %s", page, exc)
                break
