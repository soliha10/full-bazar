"""
Ozon.uz — MAHALLIY yig'uvchi (CI emas).

Ozon antibot faqat haqiqiy, avtomatlashtirilmagan Chrome ni o'tkazadi
(sabablari va tekshirilgan variantlar: scrapers/ozon.py boshidagi izoh).
Shuning uchun bu do'kon ALL_SCRAPERS ga kirmaydi va shu skript orqali
qo'lda / mahalliy jadval bo'yicha ishlatiladi.

    python python/scrape_ozon_local.py                 # 2 kategoriya, har biridan 600 ta
    python python/scrape_ozon_local.py --max 200       # tezroq sinov
    python python/scrape_ozon_local.py --sync          # yig'ib, darhol bazaga yozadi

Natija: data/ozon_products.csv — boshqa do'konlarnikiday format, ya'ni
sync_csv.py uni o'zgarishsiz qabul qiladi.

Ishlaganda ekranda Chrome oynasi ochiladi — bu normal, antibot shuni talab
qiladi. Oyna bilan ishlamang, scraper o'zi yopadi.
"""
from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.ozon import OzonScraper  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("DATA_DIR", os.path.join(ROOT, "data"))


def main() -> int:
    ap = argparse.ArgumentParser(description="Ozon.uz — mahalliy yig'uvchi")
    ap.add_argument("--max", type=int, default=None,
                    help="bitta kategoriyadan olinadigan maksimal mahsulot")
    ap.add_argument("--delay", type=float, default=1.5,
                    help="skrolllar orasidagi tanaffus (sekund)")
    ap.add_argument("--sync", action="store_true",
                    help="yig'ilgach sync_csv.py ni ishga tushiradi")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s",
                        datefmt="%H:%M:%S")

    scraper = OzonScraper(output_dir=DATA_DIR, delay=args.delay)
    if args.max:
        scraper.MAX_PER_CATEGORY = args.max

    count = scraper.run()
    print(f"\n=== {count} ta mahsulot → {os.path.join(DATA_DIR, 'ozon_products.csv')} ===")
    if count == 0:
        print("Hech narsa yig'ilmadi — Chrome ochildimi? Antibot o'tkazmagan bo'lishi mumkin.")
        return 1

    if args.sync:
        subprocess.run([sys.executable, os.path.join(ROOT, "python", "sync_csv.py")],
                       check=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
