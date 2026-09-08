"""
GSMArena specs scraper uchun qo'lda ishga tushiriladigan kichik sinov.

Bir brenddan bir nechta modelni olib, natijani chop etadi — sayt tuzilmasi
o'zgarmaganini tekshirish uchun. Bazaga hech narsa yozmaydi.

    python test_gsmarena.py            # Xiaomi, 3 ta model
    python test_gsmarena.py Samsung 5  # Samsung, 5 ta model
"""
import logging
import sys
import tempfile

sys.path.insert(0, "python")

from scrapers import gsmarena  # noqa: E402
from scrapers.gsmarena import GsmarenaSpecsScraper  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(message)s")

brand = sys.argv[1] if len(sys.argv) > 1 else "Xiaomi"
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 3

if brand not in gsmarena.BRAND_PAGES:
    sys.exit(f"Noma'lum brend: {brand}. Mavjud: {', '.join(gsmarena.BRAND_PAGES)}")

gsmarena.BRAND_PAGES = {brand: gsmarena.BRAND_PAGES[brand]}

with tempfile.TemporaryDirectory() as tmp:
    scraper = GsmarenaSpecsScraper(output_dir=tmp, delay=1.5)
    scraper.MAX_MODELS = limit

    count = 0
    for row in scraper.scrape_specs():
        count += 1
        print(f"\n── {row.display_name} ({row.brand} / {row.model_key})")
        print(f"   ekran      {row.display}")
        print(f"   protsessor {row.chipset}")
        print(f"   xotira     RAM {row.ram_options}  /  {row.storage_options}")
        print(f"   kamera     {row.main_camera}  |  selfi {row.selfie_camera}")
        print(f"   batareya   {row.battery_mah} mAh, {row.charging}")
        print(f"   OS / korpus {row.os} | {row.body} | {row.release_year}")

    print(f"\nJami: {count} ta model")
    if count == 0:
        sys.exit("Hech narsa yig'ilmadi — sayt tuzilmasi o'zgargan bo'lishi mumkin")
