from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class MediaparkScraper(BaseScraper):
    """Stub: mediapark.uz currently redirects to its homepage for all product pages."""

    store_name = "mediapark"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[mediapark] skipped — site redirects to homepage, no scraping possible")
        return
        yield  # make this a generator
