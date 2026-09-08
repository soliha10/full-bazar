"""
GSMArena — texnik xususiyatlar (specs) manbai.

Bu scraper mahsulot/narx yig'MAYDI. GSMArena da narx yo'q, shuning uchun uning
qatorlari sync_csv.py dagi `price < 100_000` filtriga tushib, 100% tashlab
yuborilardi. Buning o'rniga u endi `product_specs` jadvalini to'ldiradi —
solishtirish va mahsulot sahifasidagi "Xususiyatlar" bo'limi shundan oziqlanadi.

Chiqish: data/gsmarena_specs.csv  →  python/sync_specs.py  →  product_specs

Odob qoidalari:
  · robots.txt tekshirilgan — model sahifalari (`*-NNNNN.php`) taqiqlanmagan;
    taqiq faqat forum, login, qidiruv va shu kabi yo'llarga tegishli.
  · Har so'rov orasida kamida 1.2 s kutiladi (BaseScraper.get dan meros).
  · Har brenddan cheklangan sondagi eng yangi model olinadi (MAX_MODELS).
  · Specs tez-tez o'zgarmaydi, shuning uchun haftada bir marta ishlatiladi.
"""
from __future__ import annotations

import csv
import json
import logging
import os
import re
import shutil
from dataclasses import dataclass, field
from typing import Iterator

from bs4 import BeautifulSoup

from .base import BaseScraper, ProductRow

logger = logging.getLogger(__name__)

BASE = "https://www.gsmarena.com"

# Rasmiy makers.php3 sahifasidan olingan — taxmin qilinmagan
BRAND_PAGES: dict[str, str] = {
    "Apple":   "apple-phones-48.php",
    "Samsung": "samsung-phones-9.php",
    "Xiaomi":  "xiaomi-phones-80.php",   # Redmi va Poco ham shu yerda
    "Honor":   "honor-phones-121.php",
    "Vivo":    "vivo-phones-98.php",
    "Oppo":    "oppo-phones-82.php",
    "Realme":  "realme-phones-118.php",
    "Tecno":   "tecno-phones-120.php",
    "Infinix": "infinix-phones-119.php",
    "Zte":     "zte-phones-62.php",
}

# main.py dagi _BRAND_KWS bilan bir xil bo'lishi SHART — tartib ham muhim:
# "Xiaomi Redmi Note 15 Pro" nomida ikkala so'z ham bor, aniqrog'i yutishi kerak.
BRAND_KWS: dict[str, list[str]] = {
    "Apple":   ["apple", "iphone"],
    "Samsung": ["samsung", "galaxy"],
    "Redmi":   ["redmi"],
    "Poco":    ["poco"],
    "Xiaomi":  ["xiaomi"],
    "Honor":   ["honor"],
    "Vivo":    ["vivo"],
    "Oppo":    ["oppo"],
    "Realme":  ["realme"],
    "Tecno":   ["tecno", "camon", "spark"],
    "Infinix": ["infinix"],
    "Zte":     ["zte", "nubia"],
}

# Telefon bo'lmagan mahsulotlar ro'yxatga tushadi — ularni chiqarib tashlaymiz.
# Oxiridagi \d* kerak: "Galaxy Watch9" da "watch" dan keyin so'z chegarasi yo'q.
# Bu faqat arzon dastlabki filtr — nomga tayanib bo'lmaydi ("Infinix Xpad"
# dagi "pad" so'z boshida emas), shuning uchun asosiy tekshiruv ekran
# o'lchami bo'yicha, model sahifasi o'qilgandan keyin qilinadi.
NOT_A_PHONE = re.compile(
    r"\b(watch|tab|book|buds|band|fit|ring|gear|pad|tv|glasses)\d*\b|xpad", re.I
)

# Bundan katta ekran — planshet. Buklanadigan telefonlarning ichki ekrani
# 8" gacha boradi (Galaxy Z Fold ~8.0"), shuning uchun chegara shundan yuqori.
MAX_PHONE_INCHES = 8.5

SPEC_FIELDS = [
    "brand", "model_key", "display_name", "display", "chipset",
    "ram_options", "storage_options", "main_camera", "selfie_camera",
    "battery_mah", "charging", "os", "body", "release_year", "source_url",
]

_NORM_RE = re.compile(r"[^a-z0-9\s]")


def normalize(text: str) -> str:
    """main.py dagi _normalize_spec_text bilan bir xil."""
    return " ".join(_NORM_RE.sub(" ", text.lower()).split())


def extract_brand(text: str) -> str:
    text = text.lower()
    for canonical, kws in BRAND_KWS.items():
        if any(kw in text for kw in kws):
            return canonical.lower()
    return ""


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
    """"200 MP, f/1.7, ... 10 MP, f/2.4, ..." -> "200MP + 10MP + 50MP" """
    mps = re.findall(r"(\d+(?:\.\d+)?)\s*MP", raw or "")
    if mps:
        return _clip(" + ".join(f"{m}MP" for m in mps), limit)
    return _clip(raw, limit)


class GsmarenaSpecsScraper(BaseScraper):
    """GSMArena dan telefon xususiyatlarini yig'adi."""

    store_name = "gsmarena"

    # Har brenddan nechta eng yangi model olinadi
    MAX_MODELS = int(os.getenv("GSMARENA_MAX_MODELS", "60"))

    def __init__(self, output_dir: str, delay: float = 1.5):
        # GSMArena ga nisbatan odobli bo'lamiz — chaqiruvchi kichikroq qiymat
        # bersa ham 1.2 s dan pastga tushmaymiz.
        super().__init__(output_dir, delay=max(delay, 1.2))

    # ── Ro'yxat sahifalari ──────────────────────────────────────────────────
    def _model_links(self, brand: str, listing: str) -> list[tuple[str, str]]:
        """[(href, model nomi)] — eng yangilaridan boshlab."""
        found: list[tuple[str, str]] = []
        page = listing
        seen_pages: set[str] = set()

        while page and page not in seen_pages and len(found) < self.MAX_MODELS:
            seen_pages.add(page)
            resp = self.get(f"{BASE}/{page}")
            if not resp.ok:
                logger.warning("[gsmarena] %s HTTP %d", page, resp.status_code)
                break

            soup = BeautifulSoup(resp.text, "lxml")
            makers = soup.select_one(".makers")
            if not makers:
                break

            for a in makers.select("li a[href]"):
                span = a.find("span")
                name = span.get_text(" ", strip=True) if span else ""
                if not name or NOT_A_PHONE.search(name):
                    continue
                found.append((a["href"], name))
                if len(found) >= self.MAX_MODELS:
                    break

            nxt = soup.select_one("a.pages-next[href]")
            page = nxt["href"] if nxt and "#" not in nxt["href"] else None

        logger.info("[gsmarena] %s: %d ta model havolasi", brand, len(found))
        return found

    # ── Model sahifasi ──────────────────────────────────────────────────────
    def _parse_model(self, href: str, listing_name: str, gsm_brand: str) -> SpecRow | None:
        url = href if href.startswith("http") else f"{BASE}/{href}"
        resp = self.get(url)
        if not resp.ok:
            logger.warning("[gsmarena] %s HTTP %d", href, resp.status_code)
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        h1 = soup.select_one("h1.specs-phone-name-title")
        display_name = h1.get_text(" ", strip=True) if h1 else f"{gsm_brand} {listing_name}"

        # data-spec atributlari — sahifadagi asosiy manba
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

        # Telefon emasligini ikkinchi bor tekshirish
        if not spec.get("internalmemory") and not spec.get("chipset"):
            return None

        brand = extract_brand(f"{gsm_brand} {display_name}")
        if not brand:
            return None

        # model_key — do'kon sarlavhalarida uchraydigan qism.
        # Ro'yxatdagi nom brendsiz keladi ("Galaxy S24 Ultra", "Redmi Note 14 Pro").
        model_key = normalize(listing_name)
        if not model_key:
            return None

        # ── display: 6.8" AMOLED, 120Hz, 1440x3120 ──
        # displaytype dagi ikkinchi bo'lak ko'pincha "68B colors" kabi kam
        # foydali ma'lumot bo'ladi, shuning uchun panel turi + Hz olinadi.
        raw_type = spec.get("displaytype", "")
        size = re.search(r"([\d.]+)\s*inch", spec.get("displaysize", ""))
        res = re.search(r"(\d+)\s*x\s*(\d+)", spec.get("displayresolution", ""))
        hz = re.search(r"(\d+)\s*Hz", raw_type, re.I)

        # Planshetlarni chiqarib tashlash — nom filtri ularning hammasini
        # ushlab qololmaydi ("Infinix Xpad 30 Pro", 11" ekran).
        if size and float(size.group(1)) > MAX_PHONE_INCHES:
            logger.info("[gsmarena] %s: %s\" ekran — planshet, o'tkazib yuborildi",
                        listing_name, size.group(1))
            return None

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

        bat = re.search(r"(\d{3,6})\s*mAh", spec.get("batdescription1", "")
                        or labels.get("type", ""))

        year = re.search(r"\b(19|20)\d{2}\b",
                         spec.get("year", "") or spec.get("status", ""))

        # ── body: material + IP reytingi ──
        body_parts = []
        if spec.get("build"):
            body_parts.append(", ".join(spec["build"].split(",")[:2]).strip())
        ip = re.search(r"\bIP[X\d]{2,3}\b", spec.get("bodyother", ""))
        if ip:
            body_parts.append(ip.group(0))

        return SpecRow(
            brand=brand,
            model_key=model_key,
            display_name=_clip(display_name, 150),
            source_url=url,
            display=display,
            chipset=_clip(spec.get("chipset", ""), 150),
            ram_options=ram,
            storage_options=storage,
            main_camera=_camera_summary(spec.get("cam1modules", ""), 200),
            selfie_camera=_camera_summary(spec.get("cam2modules", ""), 150),
            battery_mah=int(bat.group(1)) if bat else None,
            charging=_clip(labels.get("charging", ""), 100),
            os=_clip(spec.get("os", "").split(",")[0], 100),
            body=_clip(", ".join(body_parts), 200),
            release_year=int(year.group(0)) if year else None,
        )

    # ── Asosiy oqim ─────────────────────────────────────────────────────────
    def scrape_specs(self) -> Iterator[SpecRow]:
        for gsm_brand, listing in BRAND_PAGES.items():
            try:
                links = self._model_links(gsm_brand, listing)
            except Exception as exc:
                logger.warning("[gsmarena] %s ro'yxati olinmadi: %s", gsm_brand, exc)
                continue

            for href, name in links:
                try:
                    row = self._parse_model(href, name, gsm_brand)
                    if row:
                        yield row
                except Exception as exc:
                    logger.warning("[gsmarena] %s tahlil qilinmadi: %s", href, exc)

    def run(self) -> int:
        os.makedirs(self.output_dir, exist_ok=True)
        filepath = os.path.join(self.output_dir, "gsmarena_specs.csv")
        tmp_path = filepath + ".tmp"

        # (brand, model_key) bo'yicha yagona bo'lishi kerak — jadvalda unique index bor
        seen: set[tuple[str, str]] = set()
        count = 0
        try:
            with open(tmp_path, "w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=SPEC_FIELDS)
                writer.writeheader()
                for row in self.scrape_specs():
                    key = (row.brand, row.model_key)
                    if key in seen:
                        continue
                    seen.add(key)
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
                    count += 1
        except Exception as exc:
            logger.error("[gsmarena] Fatal: %s", exc)

        if count > 0:
            shutil.move(tmp_path, filepath)
            logger.info("[gsmarena] %d ta model saqlandi → %s", count, filepath)
        else:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            logger.warning("[gsmarena] 0 ta model — mavjud CSV o'zgarishsiz qoldi")
        return count

    def scrape(self) -> Iterator[ProductRow]:
        """BaseScraper talab qiladi, lekin bu scraper mahsulot yig'maydi."""
        raise NotImplementedError(
            "GsmarenaSpecsScraper mahsulot emas, xususiyat yig'adi — run() ni ishlating"
        )
