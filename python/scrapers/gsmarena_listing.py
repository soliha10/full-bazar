"""GSMArena 1-bosqichi: ishlab chiqaruvchilar va ro'yxat sahifalari (GsmarenaSpecsScraper qismi)."""
from __future__ import annotations

import re
from typing import Iterator

from bs4 import BeautifulSoup

from .gsmarena_parse import (
    BASE, FALLBACK_MAKERS, MAKERS_PAGE, PRIORITY_BRANDS, SpecRow,
    _parse_listing_title, brand_table, logger, normalize,
)


class _ListingMixin:
    """Brendlar ro'yxati, do'kon filtri va ro'yxat sahifalarini o'qish."""

    # ── Ishlab chiqaruvchilar ro'yxati ──────────────────────────────────────
    def _makers(self) -> list[tuple[str, str]]:
        try:
            resp = self._fetch(MAKERS_PAGE)
            if not resp.ok:
                raise RuntimeError(f"HTTP {resp.status_code}")
            soup = BeautifulSoup(resp.text, "lxml")
            found: list[tuple[str, str]] = []
            for a in soup.select("table td a[href]"):
                href = a["href"]
                if "-phones-" not in href:
                    continue
                # "Samsung 1494 devices" -> "Samsung"
                label = re.sub(r"\s*\d+\s+devices?$", "", a.get_text(" ", strip=True)).strip()
                if label:
                    found.append((label, href))
            if found:
                logger.info("[gsmarena] %d ta ishlab chiqaruvchi topildi", len(found))
                return self._prioritize(found)
        except Exception as exc:
            logger.warning("[gsmarena] makers.php3 o'qilmadi: %s", exc)
        return self._prioritize(list(FALLBACK_MAKERS))

    @staticmethod
    def _prioritize(makers: list[tuple[str, str]]) -> list[tuple[str, str]]:
        """O'zbekiston bozorida uchraydigan brendlarni oldinga chiqaradi."""
        def rank(item: tuple[str, str]) -> tuple[int, str]:
            key = normalize(item[0]).replace(" ", "")
            try:
                return (PRIORITY_BRANDS.index(key), key)
            except ValueError:
                return (len(PRIORITY_BRANDS), key)
        return sorted(makers, key=rank)

    # ── Do'kon talabiga qarab cheklash ──────────────────────────────────────
    def _only_sold_brands(self, makers: list[tuple[str, str]]) -> list[tuple[str, str]]:
        """Do'konlarimizda umuman uchramaydigan brendlarni ro'yxatdan chiqaradi."""
        if not self.STORE_TITLES:
            return makers
        sold = {b for b in (brand_table.extract_brand(t) for t in self.STORE_TITLES) if b}
        kept = [m for m in makers
                if (brand_table.extract_brand(m[0]) or normalize(m[0])) in sold]
        logger.info("[gsmarena] do'kon filtri: %d brenddan %d tasi qoldi",
                    len(makers), len(kept))
        return kept or makers

    def _only_sold_models(self, rows: list[SpecRow]) -> list[SpecRow]:
        """
        Faqat biror do'kon sarlavhasiga mos keladigan modellarni qoldiradi.

        Moslik API dagi bilan AYNAN bir xil mantiq (brands.match_spec_row) —
        ya'ni tafsilot aynan saytda ko'rinadigan telefonlar uchun olinadi.
        """
        if not self.STORE_TITLES or not rows:
            return rows
        index = brand_table.build_spec_index(
            [{"brand": r.brand, "model_key": r.model_key} for r in rows]
        )
        wanted: set[tuple[str, str]] = set()
        for title in self.STORE_TITLES:
            hit = brand_table.match_spec_row(title, "", index)
            if hit:
                wanted.add((hit["brand"], hit["model_key"]))
        kept = [r for r in rows if (r.brand, r.model_key) in wanted]
        logger.info("[gsmarena] do'kon filtri: %d modeldan %d tasi sotilmoqda",
                    len(rows), len(kept))
        return kept

    # ── 1-bosqich: ro'yxat sahifalari ───────────────────────────────────────
    def _scrape_listing(self, maker: str, first_page: str) -> Iterator[SpecRow]:
        page_url = first_page
        seen_pages: set[str] = set()
        pages = 0

        while page_url and page_url not in seen_pages:
            if self._expired():
                logger.info("[gsmarena] %s: byudjet tugadi, %d sahifada to'xtadi",
                            maker, pages)
                return
            seen_pages.add(page_url)
            resp = self._fetch(f"{BASE}/{page_url}")
            if not resp.ok:
                logger.warning("[gsmarena] %s HTTP %d", page_url, resp.status_code)
                break

            soup = BeautifulSoup(resp.text, "lxml")
            makers_ul = soup.select_one(".makers")
            if not makers_ul:
                break

            for li in makers_ul.select("li"):
                a = li.find("a", href=True)
                span = li.find("span")
                img = li.find("img")
                if not a or not span:
                    continue
                model_name = span.get_text(" ", strip=True)
                title = (img.get("title") or "") if img else ""
                row = _parse_listing_title(
                    title, maker, model_name, f"{BASE}/{a['href']}"
                )
                if row:
                    yield row

            pages += 1
            if self.MAX_LIST_PAGES and pages >= self.MAX_LIST_PAGES:
                break

            # Keyingi sahifa: `a.prevnextbutton[title="Next page"]`.
            # (Eski kod `a.pages-next` ni qidirardi — bunday klass yo'q, shuning
            #  uchun har brenddan faqat BIRINCHI sahifa o'qilardi.)
            nxt = soup.select_one('.nav-pages a.prevnextbutton[title="Next page"]')
            page_url = nxt["href"] if nxt and "#" not in nxt["href"] else None
