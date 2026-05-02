from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class DiscontScraper(BaseScraper):
    """Stub: discont.uz does not exist (DNS failure)."""

    store_name = "discont"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[discont] skipped — discont.uz DNS failure, domain does not exist")
        return
        yield  # make this a generator
