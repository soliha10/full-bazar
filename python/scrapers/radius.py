from __future__ import annotations

import logging
import re
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)
BASE = "https://radius.uz"

# ── Nega GraphQL emas ────────────────────────────────────────────────────────
# Ilgari `new.api.radius.uz/graphql/` o'qilardi. U hali ham javob beradi, lekin
# ESKI katalogni ko'rsatadi: qaytargan mahsulotlar (HUAWEI Nova Y61, realme
# C25Y) saytda umuman yo'q, ID lari esa saytdagi ID larga mos kelmaydi —
# natijada yozilgan har bir havola 404 berardi. Ya'ni foydalanuvchi "do'konga
# o'tish" tugmasini bosganda mavjud bo'lmagan sahifaga tushardi.
#
# Saytning o'zi (Next.js) katalog sahifasini server tomonda chizadi: nom, narx
# va ishlaydigan havola HTML da bor. Sahifalash yo'q — kategoriya bir sahifada
# to'liq keladi.
CATEGORIES = (
    "2303-smartfony-i-gadzhety",
    "2340-apple",
)

_PRICE_RE = re.compile(r"[\d\s ]+")


def _price(text: str) -> float:
    m = _PRICE_RE.search(text or "")
    if not m:
        return 0.0
    digits = re.sub(r"\D", "", m.group())
    return float(digits) if digits else 0.0


class RadiusScraper(BaseScraper):
    store_name = "radius"

    def scrape(self) -> Iterator[ProductRow]:
        seen: set[str] = set()

        for category in CATEGORIES:
            url = f"{BASE}/catalog/{category}"
            try:
                resp = self.get(url)
                if not resp.ok:
                    logger.warning("[radius] %s HTTP %d", category, resp.status_code)
                    continue

                soup = BeautifulSoup(resp.text, "lxml")
                cards = soup.select("[class*=categoryCard]")
                if not cards:
                    logger.info("[radius] %s: karta topilmadi", category)
                    continue

                for card in cards:
                    a_el = card.select_one('a[href^="/product/"]')
                    if not a_el:
                        continue
                    href = a_el["href"]
                    if href in seen:
                        continue

                    img = a_el.find("img")
                    # Sarlavha `alt` da to'liq turadi ("Смартфон Samsung Galaxy
                    # A36 5G 8/256GB White"), kartadagi matn esa qisqartirilgan.
                    title = (img.get("alt") or "").strip() if img else ""
                    if not title:
                        continue

                    price_el = card.select_one("[class*=cashPrice]")
                    price = _price(price_el.get_text(" ", strip=True) if price_el else "")
                    if not price:
                        continue

                    seen.add(href)

                    # Rasm Next.js optimizatorining `/_next/image?url=...` ko'rinishida —
                    # asl manzilni ajratib olamiz.
                    src = (img.get("src") or "") if img else ""
                    m = re.search(r"url=([^&]+)", src)
                    if m:
                        from urllib.parse import unquote
                        src = unquote(m.group(1))
                    elif src.startswith("/"):
                        src = BASE + src

                    yield ProductRow(
                        title=title,
                        price=price,
                        store=self.store_name,
                        image_url=src,
                        product_url=BASE + href,
                    )

            except Exception as exc:
                logger.warning("[radius] %s error: %s", category, exc)
