from __future__ import annotations

import logging
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)


class IdeaScraper(BaseScraper):
    """Stub: idea.uz is currently broken / returns no parseable product listings."""

    store_name = "idea"

    def scrape(self) -> Iterator[ProductRow]:
        logger.info("[idea] skipped — site is currently broken or inaccessible")
        return
        yield  # make this a generator
