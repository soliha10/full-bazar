"""
GSMArena: sozlamalar, SpecRow va ro'yxat sahifasidagi qisqacha tavsifni
tahlil qilish. Tarmoqqa murojaat qilmaydi — scraperning o'zi gsmarena.py da.
"""
from __future__ import annotations

import logging
import os
import re
import sys
from dataclasses import dataclass, field

# Logger nomi asl gsmarena modulidagidek ("scrapers.gsmarena") — jurnal
# filtrlari va formatlari bo'linishdan keyin ham o'zgarmasin.
logger = logging.getLogger(__name__.replace("gsmarena_parse", "gsmarena"))

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


class RateLimited(RuntimeError):
    """GSMArena IP ni uzoq muddatga cheklab qo'ydi — ishni davom ettirish besamar."""


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
