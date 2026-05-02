from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class OzonScraper(BaseScraper):
    """Stub: ozon.uz does not exist (DNS failure)."""

    store_name = "ozon"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[ozon] skipped — ozon.uz DNS failure, domain does not exist")
        return
        yield  # make this a generator
