from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class PremierScraper(BaseScraper):
    """Stub: premier.uz has no smartphone category."""

    store_name = "premier"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[premier] skipped — no smartphone category found on premier.uz")
        return
        yield  # make this a generator
