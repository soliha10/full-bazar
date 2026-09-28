"""Barcha do'kon scraperlarini ketma-ket ishga tushiradi (GitHub Actions uchun).

Ilgari bu kod workflow ichida `python -c "..."` bo'lib turardi va HAR QANDAY
natijani 'OK' deb belgilardi. Natijada asaxiy, olcha va chakana oylab 0 ta
mahsulot berib turgani ish yashil ko'ringani uchun sezilmay qolgan: eski,
repodagi CSV qayta-qayta bazaga yozilaverdi.

Endi 0 mahsulot — xato. Ish baribir davom etadi (qolgan do'konlar yangilanishi
kerak), lekin GitHub Actions sahifasida ogohlantirish ko'rinadi va yakuniy
xulosada FAIL deb yoziladi.

    python python/run_scrapers.py --output ../data --delay 0.5
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers import ALL_SCRAPERS  # noqa: E402


def _annotate(level: str, message: str) -> None:
    """GitHub Actions ogohlantirishi (mahalliy ishda oddiy satr bo'lib chiqadi)."""
    if os.getenv("GITHUB_ACTIONS") == "true":
        print(f"::{level}::{message}", flush=True)
    else:
        print(f"[{level}] {message}", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="Barcha scraperlarni ishga tushirish")
    ap.add_argument("--output", default="../data", help="CSV lar yoziladigan papka")
    ap.add_argument("--delay", type=float, default=0.5,
                    help="so'rovlar orasidagi tanaffus (sekund)")
    ap.add_argument("--only", default="", help="vergul bilan: faqat shu do'konlar")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO,
                        format="%(levelname)s:%(name)s:%(message)s")
    os.makedirs(args.output, exist_ok=True)

    wanted = {s.strip() for s in args.only.split(",") if s.strip()}
    scrapers = [c for c in ALL_SCRAPERS if not wanted or c.store_name in wanted]

    results: list[tuple[str, int, str]] = []
    for cls in scrapers:
        started = time.time()
        print(f"[{cls.store_name}] Starting...", flush=True)
        try:
            count = cls(output_dir=args.output, delay=args.delay).run()
        except Exception as exc:
            traceback.print_exc()
            results.append((cls.store_name, 0, f"ERROR: {exc}"))
            _annotate("error", f"{cls.store_name}: {exc}")
            continue

        elapsed = time.time() - started
        if count == 0:
            # CSV o'chirilmaydi (base.run eskisini saqlaydi), lekin bu YANGI
            # narx emas — sinxronizatsiya repodagi eski faylni ishlatadi.
            results.append((cls.store_name, 0, "FAIL"))
            _annotate("warning",
                      f"{cls.store_name}: 0 ta mahsulot — eski CSV ishlatiladi, "
                      f"narxlar yangilanmadi")
        else:
            results.append((cls.store_name, count, "OK"))
            print(f"[{cls.store_name}] Done: {count} products "
                  f"({elapsed:.0f}s)", flush=True)

    print("\n=== SCRAPE SUMMARY ===", flush=True)
    for name, count, status in results:
        print(f"{name}: {count} ({status})", flush=True)

    failed = [name for name, _, status in results if status != "OK"]
    print(f"Total scrapers: {len(results)}, failed: {len(failed)}", flush=True)
    if failed:
        _annotate("warning", "Natija bermagan do'konlar: " + ", ".join(failed))

    # Chiqish kodi 0: qolgan do'konlarning yangi narxlari baribir bazaga
    # yozilishi kerak. Muammo xulosadan va ogohlantirishlardan ko'rinadi.
    return 0


if __name__ == "__main__":
    sys.exit(main())
