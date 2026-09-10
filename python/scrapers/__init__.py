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
# Wildberries/Prom o'chirildi — saytlar faoliyati to'xtagan yoki eskirgan.
# Brandstore ham o'chirildi: brandstore.uz ham, api.brandstore.uz ham 443
# portga ulanmaydi (sayt yopilgan). OLX esa barcha so'rovlarga 403 beradi
# va e'lonlar sayti sifatida ishlatilgan telefonlarni ko'rsatib, marketlar
# narxini solishtirishni buzardi.

ALL_SCRAPERS = [
    AsaxiyScraper,
    TexnomartScraper,
    OlchaScraper,
    MediaparkScraper,
    GlotrScraper,
    IdeaScraper,
    DiscontScraper,
    BeemarketScraper,
    CastoreScraper,
    MacbroScraper,
    RadiusScraper,
    ChakanaScraper,
    JoyboxScraper,
    OpenshopScraper,
    MiScraper,
    AlifScraper,
    UcellScraper,
]

