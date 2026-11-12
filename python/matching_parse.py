"""
Bitta e'lon sarlavhasini tahlil qilish: brend, model so'zlari, xotira (hajm,
RAM), tarmoq va ekrandagi toza nom. Guruhlashning o'zi matching.py da —
bu yerda faqat sarlavhadan Listing yasash qoidalari.

Bu modul baza va tarmoqqa bog'liq emas — tests/test_matching.py da sinaladi
(matching orqali: `matching.parse`, `matching.display_name`).
"""
from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "fastapi_app"))
import brands  # noqa: E402

# ── Lug'at (faqat moslashtirish uchun, ekranga chiqmaydi) ────────────────────

# Model kalitiga kirmaydigan so'zlar: tur nomi, SIM turi, versiya, sertifikat
_STOP = frozenset("""
smartfon smartfoni smartfonlar smartphone smartphones telefon phone mobile cmartfon smarton
global version versiya dual sim esim nano nanosim physical ram rom memory gb tb mb
new original official eac rst uz cn ru eu in kr hk us int intl international
with and va i ta
""".split())

# Rang so'zlari — rang model nomidan OLDIN yozilganda ("Redmi A3, Midnight Black,
# 3/64 GB") kalitga tushib qolmasligi uchun. Rus tilidagilar avtomatik tushadi
# (kirill so'zlar kalitga kirmaydi).
_COLORS = frozenset("""
black white blue green red purple violet pink gold golden silver gray grey graphite
midnight starlight titanium natural desert ocean aurora lavender frost frosted lilac navy
mint cream yellow orange lemon awesome iceblue ice lime coral bronze copper sky space
sapphire emerald jade onyx obsidian phantom glacier sage sandy sand light dark deep
cosmic star night mist misty sunset rose beige brown teal cyan turquoise aqua marine
burgundy olive peach champagne pearl platinum charcoal shadow storm stone forest
crystal glow shimmer twilight dawn dusk moonlight sunrise amber ruby ultramarine
""".split())

# Seriya so'zlari brenddan kelib chiqadi — "Samsung A55" va "Samsung Galaxy A55",
# "iPhone 16" va "Apple iPhone 16" bitta model
_IMPLIED = frozenset({"galaxy", "iphone", "apple", "samsung", "xiaomi", "mi"})

_DISPLAY_CASE = {
    "iphone": "iPhone", "oneplus": "OnePlus", "zte": "ZTE", "tcl": "TCL", "lg": "LG",
    "hmd": "HMD", "nfc": "NFC", "se": "SE", "fe": "FE", "gt": "GT", "xl": "XL",
}

_KNOWN_STORAGE = {16, 32, 64, 128, 256, 512, 1024, 2048}
_PLAUSIBLE_RAM = {1, 2, 3, 4, 6, 8, 10, 12, 16, 18, 24}

# "8/256", "8gb/256gb", "8 / 256 gb"
_PAIR_RE = re.compile(r"(?<![\d.])(\d{1,2})\s*(?:gb)?\s*/\s*(\d{2,4})\s*(gb|tb)?(?![\d])")
# "256gb", "1 tb", "1tb"
_SOLO_RE = re.compile(r"(?<![\d.])(\d{1,4})\s*(gb|tb)(?![a-z])")
_NET_RE = re.compile(r"\b(5g|4g|lte)\b")


def _canon(title: str) -> str:
    t = (title or "").lower().replace("ё", "е")
    t = re.sub(r"(\d)\s*гб\b", r"\1gb", t)
    t = re.sub(r"(\d)\s*тб\b", r"\1tb", t)
    t = re.sub(r"(\d)\s*гб", r"\1gb", t)
    t = re.sub(r"(\d)\s*тб", r"\1tb", t)
    # Openshop aksiyasi: "+100 GB of Internet + 3 months of TV-COM ..."
    t = re.sub(r"\+?\s*\d+\s*gb\s+of\s+internet.*$", "", t)
    # "12+512GB" -> "12/512GB"
    # Birinchi son harfga yopishgan bo'lmasin: "S25+ 12/256" dagi "25+ 12" emas
    t = re.sub(r"(?<![\w.])(\d{1,2})\s*\+\s*(\d{2,4})(?=\s*(?:gb|tb)|\b)", r"\1/\2", t)
    # "Pro+", "S25+", "Note 14 Pro +" -> "... plus"
    t = re.sub(r"([a-z0-9])\s*\+(?=\s|$|[^\d])", r"\1 plus ", t)
    return re.sub(r"\s+", " ", t).strip()


@dataclass
class Listing:
    brand: str
    model: frozenset[str]
    storage: int | None
    ram: int | None
    net: str | None
    display_tokens: tuple[str, ...]


def parse(title: str) -> Listing:
    t = _canon(title)
    storage = ram = None
    cut = None
    m = _PAIR_RE.search(t)
    if m:
        unit = m.group(3)
        cand = int(m.group(2)) * (1024 if unit == "tb" else 1)
        if unit or cand in _KNOWN_STORAGE:
            storage = cand
            first = int(m.group(1))
            ram = first if first in _PLAUSIBLE_RAM else None
            cut = m.start()
    if storage is None:
        for sm in _SOLO_RE.finditer(t):
            v = int(sm.group(1)) * (1024 if sm.group(2) == "tb" else 1)
            if v in _KNOWN_STORAGE:
                storage = v
                cut = sm.start()
                break
    head = t[:cut] if cut is not None else t
    net_m = _NET_RE.search(t)
    net = None if not net_m else ("4g" if net_m.group(1) == "lte" else net_m.group(1))

    brand = brands.extract_brand(t)
    # Faqat brend nomining o'zi tashlanadi. Brend aniqlash kalitlaridan
    # (tecno: camon/spark/pova) tashlab bo'lmaydi — ular SERIYA: Spark 30C va
    # Camon 30C boshqa-boshqa telefon.
    brand_words = {brand}
    words = re.findall(r"[a-z0-9]+", head)
    display = tuple(w for w in words if w not in _STOP and w not in _COLORS)
    model = frozenset(
        w for w in display
        if w not in _IMPLIED and w not in brand_words and not _NET_RE.fullmatch(w)
    )
    return Listing(brand, model, storage, ram, net, display)


def display_name(listing: Listing) -> str:
    parts = []
    seen = set()
    tokens = listing.display_tokens
    # Do'kon brendni yozmagan bo'lsa ("Galaxy A55 ...") — boshiga qo'shiladi.
    # "iPhone" o'zi brendni bildiradi, oldiga "Apple" shart emas.
    if listing.brand and listing.brand not in tokens and not (listing.brand == "apple" and "iphone" in tokens):
        tokens = (listing.brand,) + tokens
    for w in tokens:
        if w in seen:
            continue
        seen.add(w)
        if w in _DISPLAY_CASE:
            parts.append(_DISPLAY_CASE[w])
        elif any(c.isdigit() for c in w):
            parts.append(w.upper())
        else:
            parts.append(w.capitalize())
    if listing.storage:
        size = f"{listing.storage // 1024} TB" if listing.storage >= 1024 else f"{listing.storage} GB"
        parts.append(f"{listing.ram}/{size}" if listing.ram else size)
    return " ".join(parts)
