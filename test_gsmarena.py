"""
GSMArena specs scraper uchun qo'lda ishga tushiriladigan kichik sinov.

Bitta brendning ro'yxat sahifasini o'qiydi va bir nechta model sahifasini
to'liq tahlil qiladi — sayt tuzilmasi o'zgarmaganini tekshirish uchun.
Bazaga ham, CSV ga ham hech narsa yozmaydi.

    python test_gsmarena.py              # Xiaomi, 3 ta model
    python test_gsmarena.py Samsung 5    # Samsung, 5 ta model

To'liq yig'ish uchun: python python/scrape_specs_local.py
"""
import logging
import sys
import tempfile

sys.path.insert(0, "python")

from scrapers.gsmarena import FALLBACK_MAKERS, GsmarenaSpecsScraper  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(message)s")

brand = sys.argv[1] if len(sys.argv) > 1 else "Xiaomi"
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 3

pages = {name: href for name, href in FALLBACK_MAKERS}
if brand not in pages:
    sys.exit(f"Noma'lum brend: {brand}. Mavjud: {', '.join(pages)}")

with tempfile.TemporaryDirectory() as tmp:
    scraper = GsmarenaSpecsScraper(output_dir=tmp, delay=1.5)
    # Ro'yxatdan `limit` ta model olamiz, so'ng har birining sahifasini o'qiymiz.
    scraper.MAX_LIST_PAGES = 1
    scraper._start_budget(300)

    count = 0
    for row in scraper._scrape_listing(brand, pages[brand]):
        row = scraper._fetch_detail(row)
        count += 1
        print(f"\n── {row.display_name} ({row.brand} / {row.model_key})")
        print(f"   ekran      {row.display}")
        print(f"   protsessor {row.chipset}")
        print(f"   xotira     RAM {row.ram_options}  /  {row.storage_options}")
        print(f"   kamera     {row.main_camera}  |  selfi {row.selfie_camera}")
        print(f"   batareya   {row.battery_mah} mAh, {row.charging}")
        print(f"   OS / korpus {row.os} | {row.body} | {row.release_year}")
        if count >= limit:
            break

    print(f"\nJami: {count} ta model")
    if count == 0:
        sys.exit("Hech narsa yig'ilmadi — sayt tuzilmasi o'zgargan bo'lishi mumkin")
