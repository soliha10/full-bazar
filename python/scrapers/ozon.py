"""
Ozon.uz — smartfonlar.

── Nega bu scraper boshqalardan farq qiladi ──────────────────────────────────
Ozon oldida "Antibot Challenge" turadi. Tekshirilgan va ISHLAMAGAN yo'llar:

  · requests / curl (brauzer sarlavhalari, cookie bilan ham)  → 403
  · Playwright ning o'zi ishga tushirgan Chromium/Chrome      → 403
  · Firefox, WebKit                                           → 403
  · Googlebot / YandexBot / iPhone UA                          → 403
  · doimiy profil, headful rejim, 60 s kutish                  → 403

Hamma holatda challenge skripti ishlaydi, lekin `POST /abt/result` 403
qaytaradi — ya'ni sahifa emas, BRAUZERNING O'ZI rad etiladi.

ISHLAGAN yo'l: Chrome ni odatdagidek (Playwright launcher orqali emas)
`--remote-debugging-port` bilan ishga tushirib, unga CDP orqali ULANISH.
Bunda brauzerda avtomatlashtirish bayroqlari bo'lmaydi va challenge o'tadi.

Shundan kelib chiqadigan cheklov: bu scraper CI da ishlamaydi — unga
haqiqiy Chrome va grafik muhit kerak. Shuning uchun u ALL_SCRAPERS ga
kirmaydi va mahalliy ishga tushiriladi:

    python python/scrape_ozon_local.py

Natija — boshqa do'konlarniki bilan bir xil formatdagi
data/ozon_products.csv, ya'ni sync_csv.py uni o'zgarishsiz qabul qiladi.

── Odob qoidalari ────────────────────────────────────────────────────────────
robots.txt `/category/*/?page=` va `/search/` ni taqiqlaydi, kategoriyaning
o'zi (`/category/<slug>/`) esa ochiq. Shuning uchun sahifalash URL'lariga
umuman murojaat qilinmaydi: ruxsat etilgan kategoriya manzili ochiladi va
qolgan mahsulotlar saytning O'Z cheksiz-skroll mexanizmi bilan yuklanadi —
bu oddiy foydalanuvchi hosil qiladigan trafikning aynan o'zi. Skrolllar
orasida kutiladi va har kategoriyadan olinadigan mahsulot soni cheklangan.
"""
from __future__ import annotations

import logging
import os
import re
import shutil
import signal
import socket
import subprocess
import tempfile
import time
from typing import Iterator

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

BASE = "https://ozon.uz"

# robots.txt da ruxsat etilgan kategoriya manzillari (sahifalashsiz).
#
# `/category/telefony-15501/` ATAYLAB yo'q: u ota-kategoriya bo'lib, ichida
# SIM kartalar va rublda narxlangan Rossiya tovarlari uchraydi (masalan
# "Сим карта Мегафон ... 200 soʻm"), smartfonlari esa smartfony-15502 bilan
# to'liq takrorlanadi.
CATEGORIES = (
    "/category/smartfony-15502/",
)

CHROME_PATHS = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
)

# Kartochkalardan maydonlarni ajratuvchi skript. Ozon klasslari generatsiya
# qilingan (`c35_6_0-a1` kabi) va релиз sayin o'zgaradi, shuning uchun ularga
# tayanilmaydi — tuzilma va matn shakli bo'yicha olinadi.
EXTRACT_JS = r"""() => {
  const rows = [];
  document.querySelectorAll("div[data-index]").forEach(tile => {
    const a = tile.querySelector("a[href*='/product/']");
    if (!a) return;
    const isPrice = t => /so[ʻ'’`]m|сум/i.test(t);
    // Sarlavha: kartochkadagi eng uzun "barg" matn (narx/rozetka emas).
    const texts = [...tile.querySelectorAll("span,div")]
      .filter(e => e.childElementCount === 0)
      .map(e => e.textContent.trim())
      .filter(t => t.length > 15 && !isPrice(t));
    texts.sort((x, y) => y.length - x.length);
    const prices = [...tile.querySelectorAll("span")]
      .map(s => s.textContent.trim())
      .filter(isPrice);
    const img = tile.querySelector("img");
    rows.push({
      href: a.getAttribute("href") || "",
      title: texts[0] || "",
      price: prices[0] || "",
      img: img ? (img.getAttribute("src") || "") : "",
      text: (tile.innerText || "").replace(/\s+/g, " "),
    });
  });
  return rows;
}"""

# Ozon da yangi telefon yonida tiklangan/uceniy nusxalari ham turadi va ular
# 30-50% arzon. sync_csv ularni nom bo'yicha AYNAN bir mahsulotga birlashtiradi
# ("Восстановленный Samsung Galaxy A17" ~ "Samsung A17"), natijada solishtirish
# sahifasida yangi telefonning "eng arzon narxi" sifatida ishlatilgan
# qurilmaning narxi chiqadi. Shuning uchun manbadayoq tashlab yuboriladi.
_RE_USED = re.compile(
    r"восстановленн|уцен[её]нн|витринн|б\s*/\s*у\b|refurbish", re.IGNORECASE
)

_RE_RATING = re.compile(r"(\d[.,]\d)\s+\d[\d\s ]*\s*отзыв")
# Old tomonda raqam yoki nuqta turmasligi SHART: "4.9 197 отзывов" matnida
# oddiy `(\d[\d\s]*)` reytingning "9" idan boshlanib "9 197" ni ushlab olardi.
_RE_REVIEWS = re.compile(r"(?<![\d.,])(\d[\d\s ]*?)\s*отзыв")


def _price_to_number(text: str) -> float:
    """ "2 089 373 soʻm" -> 2089373.0 (bo'shliqlar NBSP bo'lishi mumkin) """
    digits = re.sub(r"\D", "", (text or "").replace(" ", " "))
    return float(digits) if digits else 0.0


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _chrome_binary() -> str:
    override = os.getenv("CHROME_PATH")
    if override and os.path.exists(override):
        return override
    for path in CHROME_PATHS:
        if os.path.exists(path):
            return path
    raise RuntimeError(
        "Chrome topilmadi. CHROME_PATH muhit o'zgaruvchisida yo'lni ko'rsating."
    )


class OzonScraper(BaseScraper):
    """Ozon.uz dan smartfonlarni haqiqiy Chrome orqali yig'adi."""

    store_name = "ozon"

    # Bitta kategoriyadan ko'pi bilan shuncha mahsulot
    MAX_PER_CATEGORY = int(os.getenv("OZON_MAX_PER_CATEGORY", "1500"))
    # Yangi mahsulot kelmagan skrolllardan keyin to'xtaymiz
    IDLE_SCROLLS = 4
    # Challenge o'tishini kutish (sekund)
    CHALLENGE_TIMEOUT = 40

    def __init__(self, output_dir: str, delay: float = 1.5):
        # delay bu yerda skrolllar orasidagi tanaffus sifatida ishlatiladi
        super().__init__(output_dir, delay=max(delay, 1.0))
        self._proc: subprocess.Popen | None = None
        self._profile: str | None = None

    # ── Chrome ni ko'tarish va CDP ga ulanish ───────────────────────────────
    def _start_chrome(self, port: int) -> None:
        self._profile = tempfile.mkdtemp(prefix="ozon-chrome-")
        cmd = [
            _chrome_binary(),
            f"--remote-debugging-port={port}",
            f"--user-data-dir={self._profile}",
            "--no-first-run",
            "--no-default-browser-check",
            "--window-size=1440,900",
            "about:blank",
        ]
        if os.getenv("OZON_HEADLESS") == "1":
            # DIQQAT: headless rejimda challenge odatda O'TMAYDI — faqat
            # sinov uchun qoldirilgan.
            cmd.insert(1, "--headless=new")
        self._proc = subprocess.Popen(
            cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )

    def _stop_chrome(self) -> None:
        if self._proc and self._proc.poll() is None:
            self._proc.send_signal(signal.SIGTERM)
            try:
                self._proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self._proc.kill()
        if self._profile:
            shutil.rmtree(self._profile, ignore_errors=True)
        self._proc, self._profile = None, None

    def _open_category(self, page, url: str) -> bool:
        """Kategoriyani ochadi; challenge o'tmasa False."""
        page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        deadline = time.monotonic() + self.CHALLENGE_TIMEOUT
        reloaded = False
        while time.monotonic() < deadline:
            try:
                page.wait_for_selector("div[data-index] a[href*='/product/']", timeout=5_000)
                return True
            except Exception:
                title = (page.title() or "").lower()
                if "antibot" not in title and "соединения" not in title:
                    continue  # sahifa ochilgan, kartochkalar hali yuklanmagan
                # Challenge: yarim vaqt o'tgach bir marta qayta yuklaymiz —
                # ba'zan birinchi urinishda cookie o'rnatilib, ikkinchisida o'tadi.
                if not reloaded and time.monotonic() > deadline - self.CHALLENGE_TIMEOUT / 2:
                    reloaded = True
                    try:
                        page.reload(wait_until="domcontentloaded", timeout=60_000)
                    except Exception:
                        pass
                time.sleep(3)
        return False

    # ── Bitta kategoriya ────────────────────────────────────────────────────
    def _scrape_category(self, page, path: str, seen: set[str]) -> Iterator[ProductRow]:
        url = BASE + path
        if not self._open_category(page, url):
            logger.warning("[ozon] %s — antibot o'tkazmadi yoki mahsulot yo'q", path)
            return

        # `seen` kategoriyalar orasida UMUMIY: Ozon da bitta mahsulot bir necha
        # kategoriyada turadi, alohida to'plam bo'lsa CSV ga takror tushardi.
        started = len(seen)
        idle = 0
        while len(seen) - started < self.MAX_PER_CATEGORY and idle < self.IDLE_SCROLLS:
            # DIQQAT: ro'yxat virtuallashtirilgan — ekrandan chiqqan kartochkalar
            # DOM dan o'chiriladi. Shuning uchun har skrolldan KEYIN emas,
            # skroll bilan BIRGA yig'iladi, aks holda boshi yo'qoladi.
            new = 0
            for item in page.evaluate(EXTRACT_JS):
                href = (item.get("href") or "").split("?")[0]
                title = (item.get("title") or "").strip()
                price = _price_to_number(item.get("price", ""))
                if not href or not title or price <= 0 or href in seen:
                    continue
                seen.add(href)
                new += 1
                if _RE_USED.search(title):
                    continue

                text = item.get("text", "")
                m_rating = _RE_RATING.search(text)
                m_reviews = _RE_REVIEWS.search(text)

                yield ProductRow(
                    title=title,
                    price=price,
                    store=self.store_name,
                    image_url=item.get("img", ""),
                    product_url=BASE + href if href.startswith("/") else href,
                    rating=m_rating.group(1).replace(",", ".") if m_rating else "",
                    review_count=re.sub(r"\D", "", m_reviews.group(1)) if m_reviews else "",
                )

            idle = 0 if new else idle + 1
            page.mouse.wheel(0, 3500)
            time.sleep(self.delay)

        logger.info("[ozon] %s: %d ta mahsulot", path, len(seen) - started)

    # ── Asosiy oqim ─────────────────────────────────────────────────────────
    def scrape(self) -> Iterator[ProductRow]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "playwright o'rnatilmagan: pip install playwright"
            ) from exc

        port = _free_port()
        self._start_chrome(port)
        try:
            with sync_playwright() as p:
                browser = None
                # Chrome ko'tarilguncha bir necha urinish
                for _ in range(15):
                    try:
                        browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{port}")
                        break
                    except Exception:
                        time.sleep(1)
                if browser is None:
                    raise RuntimeError("Chrome CDP ga ulanib bo'lmadi")

                ctx = browser.contexts[0] if browser.contexts else browser.new_context()
                page = ctx.pages[0] if ctx.pages else ctx.new_page()
                try:
                    seen: set[str] = set()
                    for path in CATEGORIES:
                        try:
                            yield from self._scrape_category(page, path, seen)
                        except Exception as exc:
                            logger.warning("[ozon] %s xatolik: %s", path, exc)
                finally:
                    browser.close()
        finally:
            self._stop_chrome()
