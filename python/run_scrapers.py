"""Barcha do'kon scraperlarini ketma-ket ishga tushiradi (GitHub Actions uchun).

Ilgari bu kod workflow ichida `python -c "..."` bo'lib turardi va HAR QANDAY
natijani 'OK' deb belgilardi. Natijada asaxiy, olcha va chakana oylab 0 ta
mahsulot berib turgani ish yashil ko'ringani uchun sezilmay qolgan: eski,
repodagi CSV qayta-qayta bazaga yozilaverdi.

Endi 0 mahsulot — xato. Ish baribir davom etadi (qolgan do'konlar yangilanishi
kerak), lekin GitHub Actions sahifasida ogohlantirish ko'rinadi va yakuniy
xulosada FAIL deb yoziladi.

    python python/run_scrapers.py --delay 0.5

Mahalliy yig'iladigan do'konlar (asaxiy, olcha, chakana) ALL_SCRAPERS ga
kirmaydi — ular CI IP laridan bloklanadi (sabablari scrapers/__init__.py da).
Ularni uy/ofis internetidan shunday yig'iladi:

    python python/run_scrapers.py --local --delay 1.5

Natija CSV + `.meta` fayllarini repoga commit qilish kerak, aks holda CI
ularni ko'rmaydi va `.meta` eskirgach sync ularni butunlay tashlab ketadi.
(Ozon — alohida, unga haqiqiy Chrome kerak: python/scrape_ozon_local.py)
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
import traceback

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

# Sukut bo'yicha repodagi data/ — cwd ga bog'liq emas. Ilgari "../data" edi va
# u faqat python/ ichidan chaqirilganda to'g'ri ishlardi; boshqa joydan
# ishga tushirilsa tasodifiy papka yaratib qo'yardi.
DEFAULT_OUTPUT = os.path.join(os.path.dirname(_HERE), "data")

from scrapers import ALL_SCRAPERS, LOCAL_SCRAPERS  # noqa: E402


def _annotate(level: str, message: str) -> None:
    """GitHub Actions ogohlantirishi (mahalliy ishda oddiy satr bo'lib chiqadi)."""
    if os.getenv("GITHUB_ACTIONS") == "true":
        print(f"::{level}::{message}", flush=True)
    else:
        print(f"[{level}] {message}", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="Barcha scraperlarni ishga tushirish")
    ap.add_argument("--output", default=DEFAULT_OUTPUT,
                    help="CSV lar yoziladigan papka (sukut: repodagi data/)")
    ap.add_argument("--delay", type=float, default=0.5,
                    help="so'rovlar orasidagi tanaffus (sekund)")
    ap.add_argument("--only", default="", help="vergul bilan: faqat shu do'konlar")
    ap.add_argument("--local", action="store_true",
                    help="CI da bloklangan, mahalliy yig'iladigan do'konlar")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO,
                        format="%(levelname)s:%(name)s:%(message)s")

    pool = LOCAL_SCRAPERS if args.local else ALL_SCRAPERS
    wanted = {s.strip() for s in args.only.split(",") if s.strip()}
    scrapers = [c for c in pool if not wanted or c.store_name in wanted]
    if not scrapers:
        sys.exit(f"--only '{args.only}' hech bir do'konga mos kelmadi. "
                 f"Mavjud: {', '.join(c.store_name for c in pool)}")

    os.makedirs(args.output, exist_ok=True)

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

    # Mahalliy yig'ish natijasi repoga tushmasa, butun ish behuda: CI o'z
    # nusxasini ko'radi va `.meta` eskirgach sync manbani tashlab ketadi.
    ok = [name for name, _, status in results if status == "OK"]
    if args.local and ok:
        files = " ".join(f"{args.output.rstrip('/')}/{n}_products.*" for n in ok)
        print("\nNatijani repoga commit qiling:", flush=True)
        print(f"    git add {files}", flush=True)
        print("    git commit -m \"chore(data): mahalliy do'konlar yangilandi\"",
              flush=True)

    # Chiqish kodi 0: qolgan do'konlarning yangi narxlari baribir bazaga
    # yozilishi kerak. Muammo xulosadan va ogohlantirishlardan ko'rinadi.
    return 0


if __name__ == "__main__":
    sys.exit(main())
