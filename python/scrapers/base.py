from __future__ import annotations

import csv
import logging
import os
import random
import shutil
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Iterator
from urllib.parse import urlsplit

import requests

logger = logging.getLogger(__name__)

# ── Nega curl_cffi ────────────────────────────────────────────────────────────
# asaxiy.uz va olcha.uz Cloudflare ortida turadi va GitHub Actions dan kelgan
# so'rovga 403 qaytaradi (o'sha manzil uy internetidan 200). Sarlavhalar
# to'g'ri bo'lsa ham rad etiladi, chunki Cloudflare TLS qo'l berishuvining
# barmoq izini (JA3/JA4) ham qaraydi: `requests` (OpenSSL) ning izi hech bir
# brauzernikiga o'xshamaydi.
#
# curl_cffi Chrome ning aynan o'sha TLS + HTTP/2 izini takrorlaydi. O'rnatilgan
# bo'lsa ishlatiladi, bo'lmasa kod avvalgidek `requests` bilan ishlaydi —
# ya'ni bu majburiy bog'liqlik emas.
try:  # pragma: no cover - ixtiyoriy bog'liqlik
    from curl_cffi import requests as curl_requests
except ImportError:  # pragma: no cover
    curl_requests = None

# curl_cffi qaysi brauzerni takrorlashi. Kutubxona yangilanganda profil nomi
# eskirishi mumkin — shunda muhit o'zgaruvchisi bilan almashtirish mumkin.
IMPERSONATE = os.getenv("SCRAPER_IMPERSONATE", "chrome")

NETWORK_ERRORS: tuple[type[BaseException], ...] = (requests.RequestException,)
if curl_requests is not None:
    NETWORK_ERRORS += (curl_requests.exceptions.RequestException,)

CSV_FIELDS = ["title", "price", "store", "image_url", "product_url", "rating", "review_count"]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "uz-UZ,uz;q=0.9,ru;q=0.8,en-US;q=0.7",
    # DIQQAT: "br" ATAYLAB yo'q. requests brotlini faqat `brotli`/`brotlicffi`
    # o'rnatilgan bo'lsa ocha oladi; ular yo'q paytda esa xato ham bermaydi —
    # javob sifatida siqilgan baytlarni matn deb qaytaradi. Natijada asaxiy,
    # texnomart va olcha jimgina "0 mahsulot" bergan (sahifa HTML emas, axlat).
    # Faqat o'zimiz ocha oladigan kodlashlarni so'raymiz.
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    # Haqiqiy Chrome HAR SO'ROVDA yuboradigan sarlavhalar. Ularsiz so'rov
    # Cloudflare uchun "brauzer emas" deb belgilanadi — asaxiy va olcha
    # GitHub Actions dan 403 qaytarardi (o'sha URL uy internetidan 200).
    # Bu IP obro'sini o'zgartirmaydi, lekin oddiy WAF qoidalaridan o'tkazadi.
    "Upgrade-Insecure-Requests": "1",
    "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}

JSON_HEADERS = {
    **HEADERS,
    "Accept": "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
    # XHR uchun navigatsiya sarlavhalari noto'g'ri — brauzer boshqacha yuboradi.
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}
JSON_HEADERS.pop("Upgrade-Insecure-Requests", None)
JSON_HEADERS.pop("Sec-Fetch-User", None)

# curl_cffi rejimida sessiya sarlavhalari ustiga to'liq to'plam yozilmaydi —
# faqat XHR ni HTML navigatsiyasidan ajratib turadigan qismi qo'shiladi.
XHR_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

# Vaqtinchalik bo'lishi mumkin bo'lgan javoblar — qayta urinib ko'ramiz.
# 403 ham shu ro'yxatda: Cloudflare ba'zan birinchi so'rovni rad etib,
# cookie o'rnatilgandan keyingisini o'tkazadi.
RETRY_STATUSES = frozenset({403, 408, 429, 500, 502, 503, 504})

# Nechta urinish va ular orasidagi kutish (sekund). Uzun emas: CI dagi butun
# yig'ish 60 daqiqaga sig'ishi kerak, scraperlar esa birinchi xato sahifadayoq
# to'xtaydi — ya'ni amalda bu qayta urinishlar sahifa boshiga bir marta.
MAX_ATTEMPTS = 3
# Sinovda radius.uz bir necha soniya 500 qaytarib turdi — 2-5 soniyalik
# oyna undan o'tib ketishga yetmagan edi.
RETRY_BACKOFF = (3.0, 12.0)


@dataclass
class ProductRow:
    title: str
    price: float
    store: str
    image_url: str = ""
    product_url: str = ""
    rating: str = ""
    review_count: str = ""


class BaseScraper(ABC):
    store_name: str

    def __init__(self, output_dir: str, delay: float = 1.5):
        self.output_dir = output_dir
        self.delay = delay
        self.session = self._new_session()
        self._warmed: set[str] = set()

    @staticmethod
    def _new_session():
        if curl_requests is not None:
            session = curl_requests.Session(impersonate=IMPERSONATE)
            # Qolgan sarlavhalarni curl_cffi ning o'zi Chrome dagidek tartibda
            # qo'yadi — ustiga yozsak, taqlid sifati pasayadi.
            session.headers.update({"Accept-Language": HEADERS["Accept-Language"]})
            return session
        session = requests.Session()
        session.headers.update(HEADERS)
        return session

    @abstractmethod
    def scrape(self) -> Iterator[ProductRow]:
        pass

    def _warm_up(self, url: str) -> None:
        """Katalogdan oldin bosh sahifani ochib, cookie larni olamiz.

        Cloudflare ortidagi do'konlar (asaxiy, olcha) katalogga to'g'ridan-to'g'ri
        kelgan, hech qanday cookie si yo'q so'rovni bot deb belgilaydi. Brauzer
        hech qachon shunday qilmaydi — u avval bosh sahifadan o'tadi. Har host
        uchun bir marta bajariladi.
        """
        parts = urlsplit(url)
        host = parts.netloc
        if not host or host in self._warmed:
            return
        self._warmed.add(host)
        try:
            self.session.get(f"{parts.scheme}://{host}/", timeout=20)
        except NETWORK_ERRORS as exc:
            logger.debug("[%s] warm-up %s: %s", self.store_name, host, exc)

    def get(self, url: str, json_mode: bool = False, **kwargs):
        """Sahifani oladi; vaqtinchalik xatolarda qayta urinadi.

        Qaytadigan javob `requests` yoki `curl_cffi` niki — ikkalasida ham
        `.ok`, `.status_code`, `.text`, `.json()` bir xil ishlaydi.
        """
        if json_mode:
            # curl_cffi da butun to'plamni almashtirmaymiz — taqlid qilingan
            # sarlavhalar tartibi saqlanib qolsin, faqat XHR ga xoslari qo'shiladi.
            kwargs.setdefault(
                "headers", XHR_HEADERS if curl_requests is not None else JSON_HEADERS
            )
        else:
            self._warm_up(url)

        kwargs.setdefault("timeout", 20)
        last_exc: BaseException | None = None
        resp = None

        for attempt in range(MAX_ATTEMPTS):
            time.sleep(self.delay + random.uniform(0, 0.5))
            try:
                resp = self.session.get(url, **kwargs)
            except NETWORK_ERRORS as exc:
                last_exc = exc
                logger.warning("[%s] %s urinish %d: %s",
                               self.store_name, url, attempt + 1, exc)
            else:
                if resp.status_code not in RETRY_STATUSES:
                    return resp
                logger.warning("[%s] %s urinish %d: HTTP %d",
                               self.store_name, url, attempt + 1, resp.status_code)

            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF[attempt])

        if resp is not None:
            return resp  # chaqiruvchi `resp.ok` ni o'zi tekshiradi
        raise last_exc  # type: ignore[misc]

    def run(self) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        filepath = os.path.join(self.output_dir, f"{self.store_name}_products.csv")
        tmp_path = filepath + ".tmp"
        count = 0
        try:
            with open(tmp_path, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
                writer.writeheader()
                for row in self.scrape():
                    if not row.title or not row.price:
                        continue
                    writer.writerow({
                        "title": row.title,
                        "price": row.price,
                        "store": row.store or self.store_name,
                        "image_url": row.image_url,
                        "product_url": row.product_url,
                        "rating": row.rating,
                        "review_count": row.review_count,
                    })
                    count += 1
        except Exception as exc:
            logger.error(f"[{self.store_name}] Fatal: {exc}")

        if count > 0:
            shutil.move(tmp_path, filepath)
            # Yonidagi `.meta` — CSV QACHON yig'ilgani. sync_csv shunga qarab
            # eskirgan manbani butunlay o'tkazib yuboradi (MAX_CSV_AGE_DAYS).
            # Mahalliy yig'iladigan do'konlar (asaxiy, olcha, chakana, ozon)
            # uchun bu yagona himoya: ularning CSV si repoda turadi va CI da
            # yangilanmaydi, ya'ni sana bo'lmasa eski narx yangidek ko'rinardi.
            #
            # Har scraper uchun yoziladi, faqat mahalliylari uchun emas: aks
            # holda CI biror kuni o'sha do'konni muvaffaqiyatli yig'sa, repodagi
            # eski `.meta` tufayli YANGI ma'lumot eskirgan deb tashlanardi.
            meta_path = os.path.join(
                self.output_dir, f"{self.store_name}_products.meta"
            )
            with open(meta_path, "w", encoding="utf-8") as fh:
                fh.write(datetime.now().astimezone().isoformat(timespec="seconds"))
            logger.info(f"[{self.store_name}] Saved {count} products → {filepath}")
        else:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            logger.warning(f"[{self.store_name}] 0 products — keeping existing CSV unchanged")
        return count
