"""GSMArena natijasi: data/gsmarena_specs.csv ni o'qish va yozish (GsmarenaSpecsScraper qismi)."""
from __future__ import annotations

import csv
import json
import os
import shutil

from .gsmarena_parse import SPEC_FIELDS, SpecRow, logger


class _CsvMixin:
    """Mavjud CSV ni qayta ishlatish va natijani atomar yozish."""

    # ── CSV ─────────────────────────────────────────────────────────────────
    def _csv_path(self) -> str:
        return os.path.join(self.output_dir, "gsmarena_specs.csv")

    def _load_existing(self) -> dict[str, SpecRow]:
        """
        Oldingi ishdan qolgan (yoki bazadan eksport qilingan) yozuvlar.
        Ular tufayli tafsilotlar qayta yuklanmaydi va qamrov hafta sayin ortadi.
        """
        path = self._csv_path()
        if not os.path.exists(path):
            return {}
        cached: dict[str, SpecRow] = {}
        try:
            with open(path, newline="", encoding="utf-8") as fh:
                for r in csv.DictReader(fh):
                    url = (r.get("source_url") or "").strip()
                    if not url:
                        continue

                    def _lst(value: str) -> list[str]:
                        try:
                            parsed = json.loads(value or "[]")
                            return [str(x) for x in parsed] if isinstance(parsed, list) else []
                        except (ValueError, TypeError):
                            return []

                    cached[url] = SpecRow(
                        brand=(r.get("brand") or "").strip(),
                        model_key=(r.get("model_key") or "").strip(),
                        display_name=(r.get("display_name") or "").strip(),
                        source_url=url,
                        display=r.get("display") or "",
                        chipset=r.get("chipset") or "",
                        ram_options=_lst(r.get("ram_options", "")),
                        storage_options=_lst(r.get("storage_options", "")),
                        main_camera=r.get("main_camera") or "",
                        selfie_camera=r.get("selfie_camera") or "",
                        battery_mah=int(r["battery_mah"]) if (r.get("battery_mah") or "").isdigit() else None,
                        charging=r.get("charging") or "",
                        os=r.get("os") or "",
                        body=r.get("body") or "",
                        release_year=int(r["release_year"]) if (r.get("release_year") or "").isdigit() else None,
                    )
        except Exception as exc:
            logger.warning("[gsmarena] mavjud CSV o'qilmadi: %s", exc)
            return {}
        logger.info("[gsmarena] mavjud CSV dan %d ta yozuv qayta ishlatiladi", len(cached))
        return cached

    def _write_csv(self, rows: list[SpecRow]) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        path = self._csv_path()
        tmp_path = path + ".tmp"

        # Jadvalda (brand, model_key) unique — takrorlarni shu yerda yechamiz.
        # Tafsiloti bori ustun turadi.
        best: dict[tuple[str, str], SpecRow] = {}
        for row in rows:
            key = (row.brand, row.model_key)
            current = best.get(key)
            if current is None or (row.has_detail and not current.has_detail):
                best[key] = row

        with open(tmp_path, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=SPEC_FIELDS)
            writer.writeheader()
            for row in best.values():
                writer.writerow({
                    "brand": row.brand,
                    "model_key": row.model_key,
                    "display_name": row.display_name,
                    "display": row.display,
                    "chipset": row.chipset,
                    "ram_options": json.dumps(row.ram_options),
                    "storage_options": json.dumps(row.storage_options),
                    "main_camera": row.main_camera,
                    "selfie_camera": row.selfie_camera,
                    "battery_mah": row.battery_mah if row.battery_mah else "",
                    "charging": row.charging,
                    "os": row.os,
                    "body": row.body,
                    "release_year": row.release_year if row.release_year else "",
                    "source_url": row.source_url,
                })

        shutil.move(tmp_path, path)
        return len(best)
