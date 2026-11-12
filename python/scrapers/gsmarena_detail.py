"""GSMArena 2-bosqichi: model sahifalari — kamera, zaryadlash, OS, korpus (GsmarenaSpecsScraper qismi)."""
from __future__ import annotations

import re
from dataclasses import replace

from bs4 import BeautifulSoup

from .gsmarena_parse import (
    PRIORITY_BRANDS, RateLimited, SpecRow, _camera_summary, _clip,
    _parse_memory, logger,
)


class _DetailMixin:
    """Model sahifasini tahlil qilish va tafsilotlarni byudjet doirasida yig'ish."""

    # ── 2-bosqich: model sahifasi ───────────────────────────────────────────
    def _fetch_detail(self, row: SpecRow) -> SpecRow:
        resp = self._fetch(row.source_url)
        if not resp.ok:
            logger.warning("[gsmarena] %s HTTP %d", row.source_url, resp.status_code)
            return row

        soup = BeautifulSoup(resp.text, "lxml")

        spec: dict[str, str] = {}
        for el in soup.select("[data-spec]"):
            key = el.get("data-spec")
            if key and key not in spec:
                spec[key] = el.get_text(" ", strip=True)

        # "Charging" da data-spec yo'q — ttl/nfo juftligidan olamiz
        labels: dict[str, str] = {}
        for ttl in soup.select("td.ttl"):
            nfo = ttl.find_next_sibling("td", class_="nfo")
            if nfo:
                labels.setdefault(ttl.get_text(" ", strip=True).lower(),
                                  nfo.get_text(" ", strip=True))

        h1 = soup.select_one("h1.specs-phone-name-title")
        display_name = h1.get_text(" ", strip=True) if h1 else row.display_name

        # ── display: 6.8" AMOLED, 120Hz, 1440x3120 ──
        raw_type = spec.get("displaytype", "")
        size = re.search(r"([\d.]+)\s*inch", spec.get("displaysize", ""))
        res = re.search(r"(\d+)\s*x\s*(\d+)", spec.get("displayresolution", ""))
        hz = re.search(r"(\d+)\s*Hz", raw_type, re.I)

        display_parts = []
        if size:
            display_parts.append(f'{size.group(1)}"')
        panel = raw_type.split(",")[0].strip()
        if panel:
            display_parts.append(panel)
        if hz:
            display_parts.append(f"{hz.group(1)}Hz")
        if res:
            display_parts.append(f"{res.group(1)}x{res.group(2)}")
        display = _clip(", ".join(display_parts), 200)

        ram, storage = _parse_memory(spec.get("internalmemory", ""))
        bat = re.search(r"(\d{3,6})\s*mAh",
                        spec.get("batdescription1", "") or labels.get("type", ""))
        year = re.search(r"\b(?:19|20)\d{2}\b",
                         spec.get("year", "") or spec.get("status", ""))

        body_parts = []
        if spec.get("build"):
            body_parts.append(", ".join(spec["build"].split(",")[:2]).strip())
        ip = re.search(r"\bIP[X\d]{2,3}\b", spec.get("bodyother", ""))
        if ip:
            body_parts.append(ip.group(0))

        # Ro'yxatdan olingan qiymat aniqroq bo'lmasa yangisi bilan almashtiriladi.
        return replace(
            row,
            display_name=_clip(display_name, 150) or row.display_name,
            display=display or row.display,
            chipset=_clip(spec.get("chipset", ""), 150) or row.chipset,
            ram_options=ram or row.ram_options,
            storage_options=storage or row.storage_options,
            main_camera=_camera_summary(spec.get("cam1modules", ""), 200),
            selfie_camera=_camera_summary(spec.get("cam2modules", ""), 150),
            battery_mah=int(bat.group(1)) if bat else row.battery_mah,
            charging=_clip(labels.get("charging", ""), 100),
            os=_clip(spec.get("os", "").split(",")[0], 100),
            body=_clip(", ".join(body_parts), 200),
            release_year=int(year.group(0)) if year else row.release_year,
        )

    # ── 2-bosqich: model sahifalari ─────────────────────────────────────────
    def _collect_details(self, collected: dict[str, SpecRow]) -> int:
        pending = self._only_sold_models(
            [r for r in collected.values() if not r.has_detail]
        )
        pending.sort(key=lambda r: (
            PRIORITY_BRANDS.index(r.brand) if r.brand in PRIORITY_BRANDS else len(PRIORITY_BRANDS),
            -(r.release_year or 0),
        ))

        if self.DETAIL_BUDGET_SEC > 0 and pending:
            self._start_budget(self.DETAIL_BUDGET_SEC)
            done = flushed = 0
            for row in pending:
                if self._expired():
                    logger.info("[gsmarena] tafsilot byudjeti tugadi")
                    break
                try:
                    collected[row.source_url] = self._fetch_detail(row)
                    done += 1
                except RateLimited as exc:
                    logger.error("[gsmarena] IP cheklandi (%s) — 2-bosqich to'xtatildi", exc)
                    break
                except Exception as exc:
                    logger.warning("[gsmarena] %s tahlil qilinmadi: %s", row.source_url, exc)
                # Ish kutilmaganda uzilsa ham yig'ilgan tafsilotlar qolsin
                if done - flushed >= self.FLUSH_EVERY:
                    self._write_csv(list(collected.values()))
                    flushed = done
                    logger.info("[gsmarena] oraliq saqlash: %d/%d ta tafsilot",
                                done, len(pending))
            logger.info("[gsmarena] 2-bosqich: %d/%d ta modelning tafsiloti olindi",
                        done, len(pending))
        self._deadline = None

        count = self._write_csv(list(collected.values()))
        with_detail = sum(1 for r in collected.values() if r.has_detail)
        logger.info("[gsmarena] %d ta model saqlandi (%d tasi to'liq tafsilotli) → %s",
                    count, with_detail, self._csv_path())
        return count
