from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class BeemarketScraper(BaseScraper):
    """Stub: beemarket.uz is a JS-rendered SPA that redirects to market.beeline.uz."""

    store_name = "beemarket"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[beemarket] skipped — JS-rendered SPA (redirects to market.beeline.uz), not scrapable without a browser")
        return
        yield  # make this a generator
