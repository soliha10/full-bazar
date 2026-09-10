"""
GSMArena — texnik xususiyatlar (specs) manbai.

Bu scraper mahsulot/narx yig'MAYDI. GSMArena da narx yo'q, shuning uchun uning
qatorlari sync_csv.py dagi `price < 100_000` filtriga tushib, 100% tashlab
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

  1-bosqich (to'liq)  — barcha brendlarning barcha ro'yxat sahifalari
                        (~300 so'rov, ~6 daqiqa) → HAR BIR telefon bazaga tushadi.
  2-bosqich (byudjet) — kamera, zaryadlash, OS va korpus faqat model
                        sahifasida bor. Ular vaqt byudjeti doirasida, eng
                        yangi va eng talabgir brendlardan boshlab yig'iladi.

Ikkinchi bosqich uzilib qolsa ham birinchisi to'liq bo'ladi. Har hafta
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

import csv
import json
import logging
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass, field, replace
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

# Brend jadvali API bilan bitta manbadan olinadi — takrorlanmasin.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fastapi_app"))
import brands as brand_table  # noqa: E402

BASE = "https://www.gsmarena.com"
MAKERS_PAGE = f"{BASE}/makers.php3"

# Bu brendlar O'zbekiston do'konlarida sotiladi — tafsilot byudjeti avval
# ularga sarflanadi. Ro'yxatda yo'q brendlar ham to'liq yig'iladi, shunchaki
# navbati keyinroq keladi.
PRIORITY_BRANDS = (
    "samsung", "xiaomi", "apple", "honor", "infinix", "tecno", "realme",
    "oppo", "vivo", "huawei", "itel", "zte", "nokia", "motorola", "google",
    "oneplus", "asus", "lenovo", "meizu", "blackview",
)

# Ishlab chiqaruvchi sahifasi topilmasa ishlatiladigan zaxira ro'yxat.
FALLBACK_MAKERS: tuple[tuple[str, str], ...] = (
    ("Apple",   "apple-phones-48.php"),
    ("Samsung", "samsung-phones-9.php"),
    ("Xiaomi",  "xiaomi-phones-80.php"),
    ("Honor",   "honor-phones-121.php"),
    ("Vivo",    "vivo-phones-98.php"),
    ("Oppo",    "oppo-phones-82.php"),
    ("Realme",  "realme-phones-118.php"),
    ("Tecno",   "tecno-phones-120.php"),
    ("Infinix", "infinix-phones-119.php"),
    ("Huawei",  "huawei-phones-58.php"),
    ("Itel",    "itel-phones-131.php"),
    ("ZTE",     "zte-phones-62.php"),
    ("Nokia",   "nokia-phones-1.php"),
    ("Motorola", "motorola-phones-4.php"),
    ("Google",  "google-phones-107.php"),
)

# Bundan katta ekran — planshet. Buklanadigan telefonlarning ichki ekrani
# 8" gacha boradi (Galaxy Z Fold ~8.0"), shuning uchun chegara shundan yuqori.
MAX_PHONE_INCHES = 8.5

SPEC_FIELDS = [
    "brand", "model_key", "display_name", "display", "chipset",
    "ram_options", "storage_options", "main_camera", "selfie_camera",
    "battery_mah", "charging", "os", "body", "release_year", "source_url",
]

normalize = brand_table.normalize


@dataclass
class SpecRow:
    brand: str
    model_key: str
    display_name: str
    source_url: str
    display: str = ""
    chipset: str = ""
    ram_options: list[str] = field(default_factory=list)
    storage_options: list[str] = field(default_factory=list)
    main_camera: str = ""
    selfie_camera: str = ""
    battery_mah: int | None = None
    charging: str = ""
    os: str = ""
    body: str = ""
    release_year: int | None = None

    @property
    def has_detail(self) -> bool:
        """Model sahifasi o'qilganmi? Kamera faqat o'sha yerda bo'ladi."""
        return bool(self.main_camera or self.selfie_camera or self.charging)


def _clip(text: str, limit: int) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _parse_memory(raw: str) -> tuple[list[str], list[str]]:
    """
    "256GB 12GB RAM, 512GB 12GB RAM, 1TB 12GB RAM" -> (["12GB"], ["256GB","512GB","1TB"])
    "64GB 4GB RAM, 128GB 4GB RAM" ham, "128GB 6GB RAM" ham qo'llab-quvvatlanadi.
    """
    storage: list[str] = []
    ram: list[str] = []
    for chunk in (raw or "").split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        m_ram = re.search(r"(\d+(?:\.\d+)?)\s*(GB|MB)\s*RAM", chunk, re.I)
        if m_ram:
            val = f"{m_ram.group(1).rstrip('.0') or m_ram.group(1)}{m_ram.group(2).upper()}"
            if val not in ram:
                ram.append(val)
            chunk = chunk[: m_ram.start()]
        m_st = re.search(r"(\d+(?:\.\d+)?)\s*(TB|GB|MB)\b", chunk, re.I)
        if m_st:
            val = f"{m_st.group(1).rstrip('.0') or m_st.group(1)}{m_st.group(2).upper()}"
            if val not in storage:
                storage.append(val)
    return ram, storage


def _camera_summary(raw: str, limit: int) -> str:
    """ "200 MP, f/1.7, ... 10 MP, f/2.4, ..." -> "200MP + 10MP + 50MP" """
    mps = re.findall(r"(\d+(?:\.\d+)?)\s*MP", raw or "")
    if mps:
        return _clip(" + ".join(f"{m}MP" for m in mps), limit)
    return _clip(raw, limit)


# ── Ro'yxatdagi `img title` ni tahlil qilish ─────────────────────────────────
# "Samsung Galaxy A07s Android smartphone. Announced Sep 2026. Features
#  6.7″  display, Helio G99+ chipset, 5000 mAh battery, 128 GB storage, 6 GB RAM."

_KINDS = ("smartphone", "tablet", "smartwatch", "watch", "phone")

_RE_YEAR    = re.compile(r"Announced[^.]*?\b((?:19|20)\d{2})\b", re.I)
_RE_INCH    = re.compile(r"(\d+(?:\.\d+)?)\s*[″\"]")
_RE_CHIP    = re.compile(r"(?:,|Features)\s*([^,.]+?)\s+chipset", re.I)
_RE_BATTERY = re.compile(r"(\d{3,6})\s*mAh", re.I)
_RE_STORAGE = re.compile(r"(\d+(?:\.\d+)?)\s*(TB|GB|MB)\s+storage", re.I)
_RE_RAM     = re.compile(r"(\d+(?:\.\d+)?)\s*(GB|MB)\s+RAM", re.I)


def _device_kind(head: str) -> str:
    """ "Apple Watch Ultra 4 watch" -> "watch" """
    low = head.lower()
    for kind in _KINDS:
        if low.endswith(" " + kind) or low == kind:
            return kind
    return ""


def _strip_kind(head: str, kind: str) -> str:
    """Tavsif turini va undan oldingi "Android"/"5G" kabi qo'shimchalarni oladi."""
    name = head[: len(head) - len(kind)].rstrip()
    return re.sub(r"\s+(Android|Windows|Symbian|Bada|Sailfish|Tizen)$", "", name).strip()


def _parse_listing_title(title: str, maker: str, model_name: str,
                         url: str) -> SpecRow | None:
    """
    Ro'yxat sahifasidagi qisqacha tavsifdan SpecRow yasaydi.
    Telefon bo'lmasa (planshet, soat) None qaytaradi.
    """
    head, _, rest = (title or "").partition(". ")
    kind = _device_kind(head)
    if kind not in ("smartphone", "phone"):
        return None

    full_name = _strip_kind(head, kind) or f"{maker} {model_name}"

    inch = _RE_INCH.search(rest)
    if inch and float(inch.group(1)) > MAX_PHONE_INCHES:
        return None  # buklanmaydigan 11" qurilma — planshet

    key = brand_table.model_key(model_name)
    if not key:
        return None
    brand = brand_table.brand_from_maker(maker, f"{maker} {model_name}")
    if not brand:
        return None

    chip = _RE_CHIP.search(rest)
    bat = _RE_BATTERY.search(rest)
    year = _RE_YEAR.search(rest)

    ram: list[str] = []
    m_ram = _RE_RAM.search(rest)
    if m_ram:
        ram = [f"{m_ram.group(1).rstrip('.0') or m_ram.group(1)}{m_ram.group(2).upper()}"]
    storage: list[str] = []
    m_st = _RE_STORAGE.search(rest)
    if m_st:
        storage = [f"{m_st.group(1).rstrip('.0') or m_st.group(1)}{m_st.group(2).upper()}"]

    return SpecRow(
        brand=brand,
        model_key=key[:100],
        display_name=_clip(full_name, 150),
        source_url=url,
        display=f'{inch.group(1)}"' if inch else "",
        chipset=_clip(chip.group(1), 150) if chip else "",
        ram_options=ram,
        storage_options=storage,
        battery_mah=int(bat.group(1)) if bat else None,
        release_year=int(year.group(1)) if year else None,
    )


class GsmarenaSpecsScraper(BaseScraper):
    """GSMArena dan BARCHA telefonlarning xususiyatlarini yig'adi."""

    store_name = "gsmarena"

    # 2-bosqich (model sahifalari) uchun vaqt byudjeti — sekundlarda.
    # 0 bo'lsa tafsilot bosqichi butunlay o'tkazib yuboriladi.
    DETAIL_BUDGET_SEC = int(os.getenv("GSMARENA_DETAIL_BUDGET", "2400"))
    # Sinov uchun brend sonini cheklash (0 = hammasi)
    MAX_BRANDS = int(os.getenv("GSMARENA_MAX_BRANDS", "0"))
    # Bitta brenddan nechta ro'yxat sahifasi (0 = hammasi)
    MAX_LIST_PAGES = int(os.getenv("GSMARENA_MAX_LIST_PAGES", "0"))

    def __init__(self, output_dir: str, delay: float = 1.5):
        # GSMArena ga nisbatan odobli bo'lamiz — chaqiruvchi kichikroq qiymat
        # bersa ham 1.2 s dan pastga tushmaymiz. Tezroq so'rov 429 keltiradi va
        # natijada umumiy vaqt UZAYADI (har cheklovdan keyin daqiqalab kutish).
        super().__init__(output_dir, delay=max(delay, 1.2))

    # ── So'rov (429 uchun qayta urinish bilan) ──────────────────────────────
    # GSMArena tez so'rovlarda 429 beradi va cheklov bir necha DAQIQA saqlanadi.
    # Qisqa kutish (20-40 s) yetmaydi: shu sababli kutish har urinishda ikki
    # barobar oshadi va oxirgisi ~4 daqiqa bo'ladi. Bitta brend uchun yo'qotilgan
    # vaqt — butun brendni yo'qotishdan arzon.
    RETRY_WAITS = (30, 60, 120, 240)

    def _fetch(self, url: str):
        resp = None
        for wait in (*self.RETRY_WAITS, None):
            resp = self.get(url)
            if resp.status_code not in (429, 503) or wait is None:
                return resp
            logger.warning("[gsmarena] %s HTTP %d — %d s kutilmoqda",
                           url, resp.status_code, wait)
            time.sleep(wait)
        return resp

    # ── Ishlab chiqaruvchilar ro'yxati ──────────────────────────────────────
    def _makers(self) -> list[tuple[str, str]]:
        try:
            resp = self._fetch(MAKERS_PAGE)
            if not resp.ok:
                raise RuntimeError(f"HTTP {resp.status_code}")
            soup = BeautifulSoup(resp.text, "lxml")
            found: list[tuple[str, str]] = []
            for a in soup.select("table td a[href]"):
                href = a["href"]
                if "-phones-" not in href:
                    continue
                # "Samsung 1494 devices" -> "Samsung"
                label = re.sub(r"\s*\d+\s+devices?$", "", a.get_text(" ", strip=True)).strip()
                if label:
                    found.append((label, href))
            if found:
                logger.info("[gsmarena] %d ta ishlab chiqaruvchi topildi", len(found))
                return self._prioritize(found)
        except Exception as exc:
            logger.warning("[gsmarena] makers.php3 o'qilmadi: %s", exc)
        return self._prioritize(list(FALLBACK_MAKERS))

    @staticmethod
    def _prioritize(makers: list[tuple[str, str]]) -> list[tuple[str, str]]:
        """O'zbekiston bozorida uchraydigan brendlarni oldinga chiqaradi."""
        def rank(item: tuple[str, str]) -> tuple[int, str]:
            key = normalize(item[0]).replace(" ", "")
            try:
                return (PRIORITY_BRANDS.index(key), key)
            except ValueError:
                return (len(PRIORITY_BRANDS), key)
        return sorted(makers, key=rank)

    # ── 1-bosqich: ro'yxat sahifalari ───────────────────────────────────────
    def _scrape_listing(self, maker: str, first_page: str) -> Iterator[SpecRow]:
        page_url = first_page
        seen_pages: set[str] = set()
        pages = 0

        while page_url and page_url not in seen_pages:
            seen_pages.add(page_url)
            resp = self._fetch(f"{BASE}/{page_url}")
            if not resp.ok:
                logger.warning("[gsmarena] %s HTTP %d", page_url, resp.status_code)
                break

            soup = BeautifulSoup(resp.text, "lxml")
            makers_ul = soup.select_one(".makers")
            if not makers_ul:
                break

            for li in makers_ul.select("li"):
                a = li.find("a", href=True)
                span = li.find("span")
                img = li.find("img")
                if not a or not span:
                    continue
                model_name = span.get_text(" ", strip=True)
                title = (img.get("title") or "") if img else ""
                row = _parse_listing_title(
                    title, maker, model_name, f"{BASE}/{a['href']}"
                )
                if row:
                    yield row

            pages += 1
            if self.MAX_LIST_PAGES and pages >= self.MAX_LIST_PAGES:
                break

            # Keyingi sahifa: `a.prevnextbutton[title="Next page"]`.
            # (Eski kod `a.pages-next` ni qidirardi — bunday klass yo'q, shuning
            #  uchun har brenddan faqat BIRINCHI sahifa o'qilardi.)
            nxt = soup.select_one('.nav-pages a.prevnextbutton[title="Next page"]')
            page_url = nxt["href"] if nxt and "#" not in nxt["href"] else None

    # ── 2-bosqich: model sahifasi ───────────────────────────────────────────
    def _fetch_detail(self, row: SpecRow) -> SpecRow:
        resp = self._fetch(row.source_url)
        if not resp.ok:
            logger.warning("[gsmarena] %s HTTP %d", row.source_url, resp.status_code)
            return row

        soup = BeautifulSoup(resp.text, "lxml")

        spec: dict[str, str] = {}
        for el in soup.select("[data-spec]"):
            key = el.get("data-spec")
            if key and key not in spec:
                spec[key] = el.get_text(" ", strip=True)

        # "Charging" da data-spec yo'q — ttl/nfo juftligidan olamiz
        labels: dict[str, str] = {}
        for ttl in soup.select("td.ttl"):
            nfo = ttl.find_next_sibling("td", class_="nfo")
            if nfo:
                labels.setdefault(ttl.get_text(" ", strip=True).lower(),
                                  nfo.get_text(" ", strip=True))

        h1 = soup.select_one("h1.specs-phone-name-title")
        display_name = h1.get_text(" ", strip=True) if h1 else row.display_name

        # ── display: 6.8" AMOLED, 120Hz, 1440x3120 ──
        raw_type = spec.get("displaytype", "")
        size = re.search(r"([\d.]+)\s*inch", spec.get("displaysize", ""))
        res = re.search(r"(\d+)\s*x\s*(\d+)", spec.get("displayresolution", ""))
        hz = re.search(r"(\d+)\s*Hz", raw_type, re.I)

        display_parts = []
        if size:
            display_parts.append(f'{size.group(1)}"')
        panel = raw_type.split(",")[0].strip()
        if panel:
            display_parts.append(panel)
        if hz:
            display_parts.append(f"{hz.group(1)}Hz")
        if res:
            display_parts.append(f"{res.group(1)}x{res.group(2)}")
        display = _clip(", ".join(display_parts), 200)

        ram, storage = _parse_memory(spec.get("internalmemory", ""))
        bat = re.search(r"(\d{3,6})\s*mAh",
                        spec.get("batdescription1", "") or labels.get("type", ""))
        year = re.search(r"\b(?:19|20)\d{2}\b",
                         spec.get("year", "") or spec.get("status", ""))

        body_parts = []
        if spec.get("build"):
            body_parts.append(", ".join(spec["build"].split(",")[:2]).strip())
        ip = re.search(r"\bIP[X\d]{2,3}\b", spec.get("bodyother", ""))
        if ip:
            body_parts.append(ip.group(0))

        # Ro'yxatdan olingan qiymat aniqroq bo'lmasa yangisi bilan almashtiriladi.
        return replace(
            row,
            display_name=_clip(display_name, 150) or row.display_name,
            display=display or row.display,
            chipset=_clip(spec.get("chipset", ""), 150) or row.chipset,
            ram_options=ram or row.ram_options,
            storage_options=storage or row.storage_options,
            main_camera=_camera_summary(spec.get("cam1modules", ""), 200),
            selfie_camera=_camera_summary(spec.get("cam2modules", ""), 150),
            battery_mah=int(bat.group(1)) if bat else row.battery_mah,
            charging=_clip(labels.get("charging", ""), 100),
            os=_clip(spec.get("os", "").split(",")[0], 100),
            body=_clip(", ".join(body_parts), 200),
            release_year=int(year.group(0)) if year else row.release_year,
        )

    # ── CSV ─────────────────────────────────────────────────────────────────
    def _csv_path(self) -> str:
        return os.path.join(self.output_dir, "gsmarena_specs.csv")

    def _load_existing(self) -> dict[str, SpecRow]:
        """
        Oldingi ishdan qolgan (yoki bazadan eksport qilingan) yozuvlar.
        Ular tufayli tafsilotlar qayta yuklanmaydi va qamrov hafta sayin ortadi.
        """
        path = self._csv_path()
        if not os.path.exists(path):
            return {}
        cached: dict[str, SpecRow] = {}
        try:
            with open(path, newline="", encoding="utf-8") as fh:
                for r in csv.DictReader(fh):
                    url = (r.get("source_url") or "").strip()
                    if not url:
                        continue

                    def _lst(value: str) -> list[str]:
                        try:
                            parsed = json.loads(value or "[]")
                            return [str(x) for x in parsed] if isinstance(parsed, list) else []
                        except (ValueError, TypeError):
                            return []

                    cached[url] = SpecRow(
                        brand=(r.get("brand") or "").strip(),
                        model_key=(r.get("model_key") or "").strip(),
                        display_name=(r.get("display_name") or "").strip(),
                        source_url=url,
                        display=r.get("display") or "",
                        chipset=r.get("chipset") or "",
                        ram_options=_lst(r.get("ram_options", "")),
                        storage_options=_lst(r.get("storage_options", "")),
                        main_camera=r.get("main_camera") or "",
                        selfie_camera=r.get("selfie_camera") or "",
                        battery_mah=int(r["battery_mah"]) if (r.get("battery_mah") or "").isdigit() else None,
                        charging=r.get("charging") or "",
                        os=r.get("os") or "",
                        body=r.get("body") or "",
                        release_year=int(r["release_year"]) if (r.get("release_year") or "").isdigit() else None,
                    )
        except Exception as exc:
            logger.warning("[gsmarena] mavjud CSV o'qilmadi: %s", exc)
            return {}
        logger.info("[gsmarena] mavjud CSV dan %d ta yozuv qayta ishlatiladi", len(cached))
        return cached

    def _write_csv(self, rows: list[SpecRow]) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        path = self._csv_path()
        tmp_path = path + ".tmp"

        # Jadvalda (brand, model_key) unique — takrorlarni shu yerda yechamiz.
        # Tafsiloti bori ustun turadi.
        best: dict[tuple[str, str], SpecRow] = {}
        for row in rows:
            key = (row.brand, row.model_key)
            current = best.get(key)
            if current is None or (row.has_detail and not current.has_detail):
                best[key] = row

        with open(tmp_path, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=SPEC_FIELDS)
            writer.writeheader()
            for row in best.values():
                writer.writerow({
                    "brand": row.brand,
                    "model_key": row.model_key,
                    "display_name": row.display_name,
                    "display": row.display,
                    "chipset": row.chipset,
                    "ram_options": json.dumps(row.ram_options),
                    "storage_options": json.dumps(row.storage_options),
                    "main_camera": row.main_camera,
                    "selfie_camera": row.selfie_camera,
                    "battery_mah": row.battery_mah if row.battery_mah else "",
                    "charging": row.charging,
                    "os": row.os,
                    "body": row.body,
                    "release_year": row.release_year if row.release_year else "",
                    "source_url": row.source_url,
                })

        shutil.move(tmp_path, path)
        return len(best)

    # ── Asosiy oqim ─────────────────────────────────────────────────────────
    def run(self) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        cached = self._load_existing()

        # ── 1-bosqich ───────────────────────────────────────────────────────
        makers = self._makers()
        if self.MAX_BRANDS:
            makers = makers[: self.MAX_BRANDS]

        collected: dict[str, SpecRow] = {}
        for maker, listing in makers:
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
                logger.info("[gsmarena] %s: %d ta telefon", maker, len(collected) - before)
            except Exception as exc:
                logger.warning("[gsmarena] %s ro'yxati olinmadi: %s", maker, exc)

        if not collected:
            logger.error("[gsmarena] 0 ta telefon — mavjud CSV o'zgarishsiz qoldi")
            return 0

        # Ro'yxatda umuman uchramagan, lekin keshda bor yozuvlarni yo'qotmaymiz
        # (GSMArena sahifani vaqtincha bermasligi mumkin).
        for url, row in cached.items():
            collected.setdefault(url, row)

        logger.info("[gsmarena] 1-bosqich tugadi: %d ta telefon", len(collected))

        # ── 2-bosqich ───────────────────────────────────────────────────────
        pending = [r for r in collected.values() if not r.has_detail]
        pending.sort(key=lambda r: (
            PRIORITY_BRANDS.index(r.brand) if r.brand in PRIORITY_BRANDS else len(PRIORITY_BRANDS),
            -(r.release_year or 0),
        ))

        if self.DETAIL_BUDGET_SEC > 0 and pending:
            deadline = time.monotonic() + self.DETAIL_BUDGET_SEC
            done = 0
            for row in pending:
                if time.monotonic() >= deadline:
                    logger.info("[gsmarena] tafsilot byudjeti tugadi", )
                    break
                try:
                    collected[row.source_url] = self._fetch_detail(row)
                    done += 1
                except Exception as exc:
                    logger.warning("[gsmarena] %s tahlil qilinmadi: %s", row.source_url, exc)
            logger.info("[gsmarena] 2-bosqich: %d/%d ta modelning tafsiloti olindi",
                        done, len(pending))

        count = self._write_csv(list(collected.values()))
        with_detail = sum(1 for r in collected.values() if r.has_detail)
        logger.info("[gsmarena] %d ta model saqlandi (%d tasi to'liq tafsilotli) → %s",
                    count, with_detail, self._csv_path())
        return count

    def scrape(self) -> Iterator[ProductRow]:
        """BaseScraper talab qiladi, lekin bu scraper mahsulot yig'maydi."""
        raise NotImplementedError(
            "GsmarenaSpecsScraper mahsulot emas, xususiyat yig'adi — run() ni ishlating"
        )
