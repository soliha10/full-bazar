"""
GSMArena specs — MAHALLIY yig'uvchi (CI emas).

Nega mahalliy? GSMArena GitHub Actions IP larini agressiv cheklaydi. 2026-09-13
dagi CI ishida 126 brenddan atigi 10 tasi o'qildi, ulardan faqat Samsung
natija berdi (qolganlari 429), model sahifalaridan esa 1564 tadan 15 tasi
olindi — ya'ni kamera/zaryadlash/OS ustunlari bo'sh qoldi. O'sha so'rovlar
uy/ofis internetidan 200 qaytaradi.

Shuning uchun ish bo'linadi:
  · MAHALLIY (shu skript)  — sahifalarni o'qiydi, data/gsmarena_specs.csv ni
                             to'ldiradi. Natija git ga commit qilinadi.
  · CI (scrape_specs.yml)  — endi hech narsa yig'maydi, faqat commit qilingan
                             CSV ni Supabase ga yozadi.

CSV — yagona manba: har ishga tushganda mavjud fayl o'qiladi va ustiga
qo'shiladi, shuning uchun bosqichma-bosqich to'ldirsa ham bo'ladi.

    python python/scrape_specs_local.py --list-only        # 1-bosqich (~15 daq)
    python python/scrape_specs_local.py --detail 3600      # + 1 soat tafsilot
    python python/scrape_specs_local.py --details-only     # faqat kamera/OS/zaryadlash
    python python/scrape_specs_local.py                    # ro'yxat + 2 soat tafsilot

GSMArena ~350 so'rovdan keyin IP ni cheklaydi (429) va cheklov soatlab
turishi mumkin, ya'ni bitta ishda olinadigan sahifa soni — cheklangan
resurs. Shuning uchun SUKUT BO'YICHA faqat do'konlarimizda sotilayotgan
telefonlar yig'iladi:
  · ro'yxat bosqichi  — faqat data/*_products.csv da uchraydigan brendlar
                        (126 dan ~20 tasi)
  · tafsilot bosqichi — faqat biror do'kon sarlavhasiga mos kelgan modellar
                        (moslik API dagi bilan bir xil: brands.match_spec_row)
GSMArena dagi hamma telefon kerak bo'lsa: --all-models.

Ro'yxatlar bir marta yig'ilgach, keyingi ishlarni `--details-only` bilan
ishlating: butun resurs hali bo'sh turgan ustunlarga sarflanadi va qamrov
har ish bilan o'sib boradi.

Tugagach o'zgarishni commit qiling:
    git add data/gsmarena_specs.csv && git commit -m "chore(specs): GSMArena yangilandi"
"""
from __future__ import annotations

import argparse
import csv
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers import GsmarenaSpecsScraper  # noqa: E402

DATA_DIR = os.getenv(
    "DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"),
)


def store_titles(data_dir: str) -> list[str]:
    """
    Do'konlarimiz sotayotgan telefonlarning sarlavhalari (data/*_products.csv).

    Bazaga ulanmaydi: CSV lar scraperlar chiqarigan yagona manba va mahalliy
    mashinada Supabase maxfiy so'zi yo'q.
    """
    titles: list[str] = []
    for fn in sorted(os.listdir(data_dir)):
        if not fn.endswith("_products.csv"):
            continue
        try:
            with open(os.path.join(data_dir, fn), encoding="utf-8-sig",
                      errors="ignore") as fh:
                for row in csv.DictReader(fh):
                    title = (row.get("title") or "").strip()
                    if title:
                        titles.append(title)
        except OSError as exc:
            print(f"  skip {fn}: {exc}")
    return titles


def main() -> int:
    ap = argparse.ArgumentParser(description="GSMArena specs — mahalliy yig'uvchi")
    ap.add_argument("--list-only", action="store_true",
                    help="faqat ro'yxat sahifalari (tez, barcha telefonlar bazaga tushadi)")
    ap.add_argument("--details-only", action="store_true",
                    help="ro'yxatlarni o'tkazib, mavjud CSV dagi modellarning "
                         "kamera/zaryadlash/OS ma'lumotini yig'adi")
    ap.add_argument("--detail", type=int, default=7200,
                    help="model sahifalariga sarflanadigan sekund (0 = o'tkazib yuborish)")
    ap.add_argument("--list-budget", type=int, default=0,
                    help="ro'yxat bosqichi uchun sekund (0 = cheksiz)")
    ap.add_argument("--delay", type=float, default=1.2,
                    help="so'rovlar orasidagi kechikish (sekund)")
    ap.add_argument("--all-models", action="store_true",
                    help="GSMArena dagi BARCHA telefonlar (sukut bo'yicha faqat "
                         "do'konlarimizda sotilayotganlari yig'iladi)")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s",
                        datefmt="%H:%M:%S")

    scraper = GsmarenaSpecsScraper(output_dir=DATA_DIR, delay=args.delay)
    scraper.LIST_BUDGET_SEC = args.list_budget
    scraper.DETAIL_BUDGET_SEC = 0 if args.list_only else args.detail
    scraper.DETAILS_ONLY = args.details_only
    if not args.all_models:
        titles = store_titles(DATA_DIR)
        scraper.STORE_TITLES = titles
        print(f"Do'kon sarlavhalari: {len(titles)} ta — yig'ish shular bilan cheklanadi "
              f"(hammasi kerak bo'lsa --all-models)")

    count = scraper.run()
    print(f"\n=== {count} ta model → {os.path.join(DATA_DIR, 'gsmarena_specs.csv')} ===")
    if count == 0:
        print("Hech narsa yig'ilmadi — sayt tuzilmasi o'zgargan bo'lishi mumkin")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
