"""
GSMArena — texnik xususiyatlar (specs) manbai.

Bu scraper mahsulot/narx yig'MAYDI. GSMArena da narx yo'q, shuning uchun uning
qatorlari sync/load.py dagi `price < 100_000` filtriga tushib, 100% tashlab
yuborilardi. Buning o'rniga u `product_specs` jadvalini to'ldiradi —
solishtirish va mahsulot sahifasidagi "Xususiyatlar" bo'limi shundan oziqlanadi.

Chiqish: data/gsmarena_specs.csv  →  python/sync_specs.py  →  product_specs

── Nega ikki bosqich ──────────────────────────────────────────────────────────
GSMArena da ~15 000 qurilma bor. Har biri uchun alohida model sahifasini
o'qish 1 s kechikish bilan ham ~4 soat oladi — bitta CI ishiga sig'maydi.
Lekin ro'yxat sahifasidagi har bir rasmning `title` atributida qurilmaning
qisqacha tavsifi turadi:

    "Samsung Galaxy A07s Android smartphone. Announced Sep 2026. Features
     6.7″ display, Helio G99+ chipset, 5000 mAh battery, 128 GB storage, 6 GB RAM."

Ya'ni brend, model, yil, ekran, protsessor, batareya, xotira va RAM ni
50 ta qurilma uchun BITTA so'rovda olsa bo'ladi. Shuning uchun:

  1-bosqich (byudjet) — brendlarning ro'yxat sahifalari, ustuvor brendlardan
                        boshlab → HAR BIR telefon bazaga tushadi.
  2-bosqich (byudjet) — kamera, zaryadlash, OS va korpus faqat model
                        sahifasida bor. Ular vaqt byudjeti doirasida, eng
                        yangi va eng talabgir brendlardan boshlab yig'iladi.

HAR IKKALA bosqich vaqt byudjeti bilan cheklangan. Bu majburiy: 429 dan keyingi
kutishlar tufayli 1-bosqich soatlab cho'zilishi va butun CI ishi timeout ga
uchrashi mumkin — u holda CSV umuman yozilmay, bir soatlik ish yo'qoladi.
CSV 1-bosqich oxirida va 2-bosqich davomida oraliq saqlanadi, shuning uchun
qadam uzilib qolsa ham yig'ilgani sync ga yetib boradi.

Ikkinchi bosqich uzilib qolsa ham birinchisining natijasi saqlanadi. Har hafta
ishga tushganda mavjud CSV (yoki bazadan eksport) qayta ishlatiladi, ya'ni
tafsilotlar to'plami asta-sekin to'lib boradi va hech narsa qaytadan
yuklanmaydi.

Odob qoidalari:
  · robots.txt tekshirilgan — model va ro'yxat sahifalari taqiqlanmagan;
    taqiq faqat forum, login, qidiruv va shu kabi yo'llarga tegishli.
  · Har so'rov orasida kamida 1.2 s kutiladi (BaseScraper.get dan meros).
  · 429/503 kelsa progressiv kutish bilan qayta uriniladi.
"""
from __future__ import annotations

import logging
import os
from dataclasses import replace
from typing import Iterator

from .base import BaseScraper, ProductRow
from .gsmarena_csv import _CsvMixin
from .gsmarena_detail import _DetailMixin
from .gsmarena_fetch import _FetchMixin
from .gsmarena_listing import _ListingMixin
# Sozlamalar, SpecRow va tavsif tahlili gsmarena_parse.py da. Ular shu modul
# orqali ham import qilinadi (`from scrapers.gsmarena import SpecRow`).
from .gsmarena_parse import (  # noqa: F401
    BASE, FALLBACK_MAKERS, MAKERS_PAGE, MAX_PHONE_INCHES, PRIORITY_BRANDS,
    SPEC_FIELDS, RateLimited, SpecRow, _camera_summary, _clip, _device_kind,
    _parse_listing_title, _parse_memory, _strip_kind, brand_table, normalize,
)

logger = logging.getLogger(__name__)


# Kod bosqichlar bo'yicha bo'lingan: so'rov va byudjet — gsmarena_fetch.py,
# 1-bosqich — gsmarena_listing.py, 2-bosqich — gsmarena_detail.py,
# CSV — gsmarena_csv.py. Bu yerda sozlamalar va asosiy oqim (run).
class GsmarenaSpecsScraper(_FetchMixin, _ListingMixin, _DetailMixin, _CsvMixin,
                           BaseScraper):
    """GSMArena dan BARCHA telefonlarning xususiyatlarini yig'adi."""

    store_name = "gsmarena"

    # Har bosqich uchun ALOHIDA vaqt byudjeti — sekundlarda. Ikkalasining
    # yig'indisi workflow dagi `timeout-minutes` dan kichik bo'lishi SHART:
    # timeout bo'lsa qadam o'ldiriladi va sync umuman ishlamaydi.
    #
    # 1-bosqich (ro'yxat sahifalari). Brendlar ustuvorlik bo'yicha saralangan,
    # shuning uchun byudjet tugasa qolgan (kam uchraydigan) brendlar keyingi
    # ishga qoladi — mavjud CSV/eksport tufayli hech narsa yo'qolmaydi.
    LIST_BUDGET_SEC = int(os.getenv("GSMARENA_LIST_BUDGET", "1500"))
    # 2-bosqich (model sahifalari). 0 bo'lsa tafsilot bosqichi o'tkazib yuboriladi.
    DETAIL_BUDGET_SEC = int(os.getenv("GSMARENA_DETAIL_BUDGET", "2400"))
    # 429 dan keyin kechikish shu qiymatgacha o'sadi
    MAX_DELAY = 5.0
    # 2-bosqichda har shuncha modeldan keyin CSV oraliq saqlanadi
    FLUSH_EVERY = 200
    # Ro'yxat bosqichini butunlay o'tkazib yuborish (mavjud CSV asos bo'ladi)
    DETAILS_ONLY = False
    # Do'konlarimizdagi mahsulot sarlavhalari (normalizatsiyalanmagan).
    # Berilsa, ish faqat SOTILAYOTGAN telefonlar bilan cheklanadi:
    #   · ro'yxat bosqichi — faqat shu sarlavhalarda uchraydigan brendlar
    #   · tafsilot bosqichi — faqat biror sarlavhaga mos kelgan modellar
    # Bu so'rovlar sonini bir necha barobar kamaytiradi, ya'ni GSMArena
    # cheklovigacha bo'lgan resurs aynan saytda ko'rinadigan ma'lumotga
    # sarflanadi. Bo'sh bo'lsa hamma narsa yig'iladi (eski xatti-harakat).
    STORE_TITLES: list[str] = []
    # Sinov uchun brend sonini cheklash (0 = hammasi)
    MAX_BRANDS = int(os.getenv("GSMARENA_MAX_BRANDS", "0"))
    # Bitta brenddan nechta ro'yxat sahifasi (0 = hammasi)
    MAX_LIST_PAGES = int(os.getenv("GSMARENA_MAX_LIST_PAGES", "0"))

    def __init__(self, output_dir: str, delay: float = 1.5):
        # GSMArena ga nisbatan odobli bo'lamiz — chaqiruvchi kichikroq qiymat
        # bersa ham 1.2 s dan pastga tushmaymiz. Tezroq so'rov 429 keltiradi va
        # natijada umumiy vaqt UZAYADI (har cheklovdan keyin daqiqalab kutish).
        super().__init__(output_dir, delay=max(delay, 1.2))
        # 429 kelganda self.delay vaqtincha oshadi, so'ng shu qiymatga qaytadi
        self._base_delay = self.delay
        # Joriy bosqichning tugash vaqti (time.monotonic); None = cheklovsiz
        self._deadline: float | None = None
        # Ketma-ket to'liq cheklangan manzillar soni (BAN_GIVEUP ga qarang)
        self._banned_streak = 0

    # ── Asosiy oqim ─────────────────────────────────────────────────────────
    def run(self) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        cached = self._load_existing()

        # ── Faqat tafsilot rejimi ───────────────────────────────────────────
        # GSMArena ~350 so'rovdan keyin IP ni cheklaydi, ya'ni bitta ishda
        # olinadigan sahifa soni CHEKLANGAN resurs. Ro'yxatlar allaqachon
        # yig'ilgan bo'lsa, o'sha resursni ularni qayta o'qishga emas, hali
        # bo'sh turgan kamera/zaryadlash/OS ustunlariga sarflash foydaliroq.
        if self.DETAILS_ONLY:
            if not cached:
                logger.error("[gsmarena] --details-only uchun mavjud CSV kerak, "
                             "u topilmadi — avval ro'yxatlarni yig'ing")
                return 0
            logger.info("[gsmarena] faqat tafsilot rejimi: %d ta yozuv asos qilinadi",
                        len(cached))
            return self._collect_details(dict(cached))

        # ── 1-bosqich ───────────────────────────────────────────────────────
        # Byudjet makers.php3 dan boshlanadi — u ham 429 ga tushishi mumkin.
        self._start_budget(self.LIST_BUDGET_SEC)
        makers = self._makers()
        makers = self._only_sold_brands(makers)
        if self.MAX_BRANDS:
            makers = makers[: self.MAX_BRANDS]

        collected: dict[str, SpecRow] = {}
        for idx, (maker, listing) in enumerate(makers):
            if self._expired():
                logger.warning(
                    "[gsmarena] ro'yxat byudjeti tugadi — %d/%d brend o'qildi, "
                    "qolgani keyingi ishga qoladi", idx, len(makers))
                break
            try:
                before = len(collected)
                for row in self._scrape_listing(maker, listing):
                    old = cached.get(row.source_url)
                    # Eski yozuvda kamera/zaryadlash bor — ularni saqlab qolamiz,
                    # qolgan maydonlarni yangi ro'yxatdan yangilaymiz.
                    if old and old.has_detail:
                        row = replace(
                            row,
                            display=old.display or row.display,
                            chipset=old.chipset or row.chipset,
                            ram_options=old.ram_options or row.ram_options,
                            storage_options=old.storage_options or row.storage_options,
                            main_camera=old.main_camera,
                            selfie_camera=old.selfie_camera,
                            charging=old.charging,
                            os=old.os,
                            body=old.body,
                            display_name=old.display_name or row.display_name,
                        )
                    collected[row.source_url] = row
                added = len(collected) - before
                logger.info("[gsmarena] %s: %d ta telefon", maker, added)
                # Har brenddan keyin saqlaymiz. Ilgari CSV faqat 1-bosqich
                # OXIRIDA yozilardi: ish uzilsa (cheklov, Ctrl+C, timeout)
                # soatlab yig'ilgan hamma narsa yo'qolardi.
                if added:
                    self._write_csv([
                        *collected.values(),
                        *(r for url, r in cached.items() if url not in collected),
                    ])
            except RateLimited as exc:
                logger.error(
                    "[gsmarena] IP cheklandi (%s) — 1-bosqich to'xtatildi. "
                    "Yig'ilgani saqlanadi; bir necha soatdan keyin qayta uring.",
                    exc)
                break
            except Exception as exc:
                logger.warning("[gsmarena] %s ro'yxati olinmadi: %s", maker, exc)

        if not collected:
            logger.error("[gsmarena] 0 ta telefon — mavjud CSV o'zgarishsiz qoldi")
            return 0

        # Ro'yxatda umuman uchramagan, lekin keshda bor yozuvlarni yo'qotmaymiz
        # (GSMArena sahifani vaqtincha bermasligi mumkin).
        for url, row in cached.items():
            collected.setdefault(url, row)

        # 2-bosqich uzilib qolsa ham (timeout, tarmoq) ro'yxat ma'lumoti
        # yo'qolmasin — CSV ni shu yerda yozib qo'yamiz.
        self._write_csv(list(collected.values()))
        logger.info("[gsmarena] 1-bosqich tugadi: %d ta telefon (CSV saqlandi)",
                    len(collected))

        return self._collect_details(collected)

    def scrape(self) -> Iterator[ProductRow]:
        """BaseScraper talab qiladi, lekin bu scraper mahsulot yig'maydi."""
        raise NotImplementedError(
            "GsmarenaSpecsScraper mahsulot emas, xususiyat yig'adi — run() ni ishlating"
        )
