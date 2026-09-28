from .asaxiy import AsaxiyScraper
from .texnomart import TexnomartScraper
from .olcha import OlchaScraper
from .mediapark import MediaparkScraper
from .glotr import GlotrScraper
from .idea import IdeaScraper
from .discont import DiscontScraper
from .beemarket import BeemarketScraper
from .castore import CastoreScraper
from .macbro import MacbroScraper
from .radius import RadiusScraper
from .chakana import ChakanaScraper
from .joybox import JoyboxScraper
from .openshop import OpenshopScraper
from .mi import MiScraper
from .alif import AlifScraper
from .ucell import UcellScraper
# GSMArena narx emas, xususiyat manbai — ALL_SCRAPERS ga kirmaydi,
# alohida oqim bilan product_specs jadvalini to'ldiradi.
from .gsmarena import GsmarenaSpecsScraper
# Ozon ham ALL_SCRAPERS ga kirmaydi: antibot faqat haqiqiy, avtomatlashtirilmagan
# Chrome ni o'tkazadi (requests, Playwright ning o'z Chromium/Chrome/Firefox/WebKit
# i — hammasi 403). Shuning uchun CI da emas, mahalliy ishlatiladi:
#     python python/scrape_ozon_local.py
from .ozon import OzonScraper
# Uzum Market ham shu sababdan yo'q: uzum.uz Yandex antibotiga o'xshash
# himoya bilan `?_ycch=` ga cheksiz yo'naltiradi, graphql.uzum.uz esa 401
# beradi. Kerak bo'lsa Ozon dagi kabi (haqiqiy Chrome + CDP) yondashuv bilan
# qo'shish mumkin.

# ── Mahalliy yig'iladigan do'konlar ──────────────────────────────────────────
# Bu uchtasi CI da ISHLAMAYDI — sabab kodda emas, GitHub Actions IP larida.
# 2026-09-28 dagi ish (36449651045) buni aniq ko'rsatdi, o'sha URL lar
# mahalliy internetdan muammosiz ochiladi:
#
#   asaxiy  — Cloudflare 403, uch urinishda ham. curl_cffi bilan Chrome ning
#             TLS barmoq izi takrorlanganda ham o'zgarmadi, ya'ni to'siq
#             JA3 da emas, IP obro'sida.
#   olcha   — xuddi shunday 403.
#   chakana — api.chakana.uz TCP ulanishni umuman qabul qilmaydi
#             (`curl: (28) Connection timed out`), ya'ni HTTP darajasigacha
#             ham yetmaydi.
#
# Shuning uchun ular ALL_SCRAPERS dan chiqarildi va Ozon dagi yo'l bilan
# mahalliy yig'iladi, natija repoga commit qilinadi:
#
#     python python/run_scrapers.py --local
#     git add data/asaxiy_products.* data/olcha_products.* data/chakana_products.*
#     git commit -m "chore(data): mahalliy do'konlar yangilandi"
#
# CSV yonida `.meta` yoziladi (base.BaseScraper.run). Agar mahalliy yig'ish
# MAX_CSV_AGE_DAYS kundan ko'proq qilinmasa, sync_csv o'sha manbani butunlay
# o'tkazib yuboradi — narxsiz qolgan afzal, eski narxni yangidek ko'rsatgandan.
LOCAL_SCRAPERS = [
    AsaxiyScraper,
    OlchaScraper,
    ChakanaScraper,
]

# Wildberries/Prom o'chirildi — saytlar faoliyati to'xtagan yoki eskirgan.
# Brandstore ham o'chirildi: brandstore.uz ham, api.brandstore.uz ham 443
# portga ulanmaydi (sayt yopilgan). OLX esa barcha so'rovlarga 403 beradi
# va e'lonlar sayti sifatida ishlatilgan telefonlarni ko'rsatib, marketlar
# narxini solishtirishni buzardi.

ALL_SCRAPERS = [
    TexnomartScraper,
    MediaparkScraper,
    GlotrScraper,
    IdeaScraper,
    DiscontScraper,
    BeemarketScraper,
    CastoreScraper,
    MacbroScraper,
    RadiusScraper,
    JoyboxScraper,
    OpenshopScraper,
    MiScraper,
    AlifScraper,
    UcellScraper,
]

