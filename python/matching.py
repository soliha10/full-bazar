"""
Do'konlar orasida bir xil telefonni topish: bitta mahsulot = brend + model +
xotira (hajm, RAM). Rang — variant, alohida mahsulot emas.

Nega kerak: ilgari guruhlash butun sarlavhani kosinus o'xshashligi (>= 0.85)
bilan solishtirardi. Har bir rang alohida mahsulot edi va do'konlarning
"Смартфон", "Ростест (EAC)", "(nanoSim+eSIM)", "+100 GB of Internet", rus tilidagi
rang nomlari kabi qo'shimchalari o'xshashlikni chegaradan pastga tushirardi.
Natijada 2026-11-12 da guruhlarning atigi ~10% i ikki va undan ortiq do'konda
edi — "iPhone 16 Pro Max 1TB" yettita alohida, bittadan do'konli mahsulotga
bo'linib ketgan edi.

Bu modul baza va tarmoqqa bog'liq emas — tests/test_matching.py da sinaladi.
"""
from __future__ import annotations

import hashlib
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field

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


# ── Guruhlash ────────────────────────────────────────────────────────────────

@dataclass
class Group:
    key: str
    rows: list = field(default_factory=list)
    listings: list = field(default_factory=list)

    @property
    def pid(self) -> str:
        return "prod-" + hashlib.md5(self.key.encode()).hexdigest()[:20]

    def best_listing(self) -> Listing:
        """Nom uchun: eng to'liq yozilgani (RAM, hajm, tarmoq bor; keyin eng qisqa nom)."""
        return min(self.listings, key=lambda l: (l.ram is None, l.storage is None, l.net is None, len(l.display_tokens)))


def _split_by(items: list, attr: str) -> list[list]:
    """Ma'lum qiymatlar bir nechta bo'lsa — har biriga alohida guruh; noma'lumlar eng ko'piga."""
    known = Counter(getattr(l, attr) for _, l in items if getattr(l, attr) is not None)
    if len(known) <= 1:
        return [items]
    top = known.most_common(1)[0][0]
    buckets: dict = defaultdict(list)
    for it in items:
        val = getattr(it[1], attr)
        buckets[val if val is not None else top].append(it)
    return [buckets[k] for k in sorted(buckets, key=str)]


def group_rows(rows: list[dict]) -> list[Group]:
    """
    rows: {"title": ...} li lug'atlar (qolgan maydonlar o'zgarishsiz qaytadi).

    Qoidalar ehtiyotkor:
      · model kaliti (brend + model so'zlari to'plami) va xotira hajmi bir xil;
      · RAM va tarmoq (4G/5G) faqat IKKALASIDA yozilgan va farq qilganda ajratadi;
      · xotirasi umuman yozilmagan e'lon faqat model yagona variantda bo'lsa qo'shiladi;
      · brendi aniqlanmagan yoki model so'zi qolmagan e'lon birlashtirilmaydi.
    """
    parsed = [(row, parse(row["title"])) for row in rows]
    by_model: dict = defaultdict(list)
    loners: list = []
    for row, l in parsed:
        if not l.brand or not l.model:
            loners.append((row, l))
        else:
            by_model[(l.brand, l.model)].append((row, l))

    groups: list[Group] = []

    def emit(items: list, brand: str, model: frozenset, storage) -> None:
        for by_ram in _split_by(items, "ram"):
            for by_net in _split_by(by_ram, "net"):
                ram = next((l.ram for _, l in by_net if l.ram is not None), None)
                net = next((l.net for _, l in by_net if l.net is not None), None)
                key = f"{brand}|{' '.join(sorted(model))}|{storage or 'x'}|{ram or 'x'}|{net or 'x'}"
                g = Group(key)
                for row, l in by_net:
                    g.rows.append(row)
                    g.listings.append(l)
                groups.append(g)

    for (brand, model), items in by_model.items():
        sized = [it for it in items if it[1].storage is not None]
        unsized = [it for it in items if it[1].storage is None]
        storages = sorted({l.storage for _, l in sized})
        by_storage: dict = defaultdict(list)
        for it in sized:
            by_storage[it[1].storage].append(it)
        rams = {l.ram for _, l in sized if l.ram is not None}
        if len(storages) == 1 and len(rams) <= 1:
            # Hajmi yozilmagan e'lon — faqat model YAGONA variantda bo'lsa
            # (bitta hajm va bitta RAM). Aks holda qaysi varianti ekanini
            # taxmin qilish narxni noto'g'ri ko'rsatishi mumkin.
            by_storage[storages[0]] += unsized
            unsized = []
        for st in storages:
            emit(by_storage[st], brand, model, st)
        if unsized:
            emit(unsized, brand, model, None)

    for row, l in loners:
        # Har biri o'zi — sarlavhaning o'zi kalit (rang farqi ham saqlanadi)
        g = Group("loner|" + _canon(row["title"]))
        g.rows.append(row)
        g.listings.append(l)
        groups.append(g)

    # Bir xil sarlavhali yolg'iz e'lonlar (turli do'kon) baribir birlashsin
    merged: dict[str, Group] = {}
    for g in groups:
        if g.key in merged:
            merged[g.key].rows += g.rows
            merged[g.key].listings += g.listings
        else:
            merged[g.key] = g
    return sorted(merged.values(), key=lambda g: g.key)


# ── Narxi g'ayritabiiy takliflar ─────────────────────────────────────────────
# Moslashtirish yaxshilangach, avval "yolg'iz" qolgan noto'g'ri narxlar
# haqiqiy model bilan bir guruhga tushadi va "eng arzon" bo'lib ko'rinadi:
# Ozon dagi "Xiaomi 17" 1.26 mln (boshqalarda 11–17 mln), Chakana dagi
# "Poco X8 Pro" 630 ming (5.6–7.9 mln), Openshop aksiya narxlari. Ular
# foydalanuvchini aldaydi, shuning uchun:
#   · 3+ do'kon: medianadan 2 barobar arzon yoki qimmat do'kon taklifi chiqariladi;
#   · 2 do'kon va farq 2 barobardan ko'p: qaysi biri to'g'ri ekanini bilib
#     bo'lmaydi — guruh birlashtirilmaydi (har do'kon o'z mahsuloti).
OUTLIER_FACTOR = 2.0


def _store_best(rows: list[dict]) -> dict[str, float]:
    best: dict[str, float] = {}
    for r in rows:
        if r["src"] not in best or r["price"] < best[r["src"]]:
            best[r["src"]] = r["price"]
    return best


def drop_price_outliers(groups: list[Group]) -> tuple[list[Group], int]:
    """(tozalangan guruhlar, chiqarib tashlangan takliflar soni)"""
    out: list[Group] = []
    dropped = 0
    for g in groups:
        best = _store_best(g.rows)
        if len(best) >= 3:
            prices = sorted(best.values())
            mid = len(prices) // 2
            median = prices[mid] if len(prices) % 2 else (prices[mid - 1] + prices[mid]) / 2
            bad = {s for s, p in best.items() if p * OUTLIER_FACTOR < median or p > median * OUTLIER_FACTOR}
            if bad:
                keep = [(r, l) for r, l in zip(g.rows, g.listings) if r["src"] not in bad]
                dropped += sum(1 for r in g.rows if r["src"] in bad)
                g.rows, g.listings = [r for r, _ in keep], [l for _, l in keep]
            out.append(g)
        elif len(best) == 2 and max(best.values()) > min(best.values()) * OUTLIER_FACTOR:
            for src in sorted(best):
                sub = Group(f"{g.key}|{src}")
                for r, l in zip(g.rows, g.listings):
                    if r["src"] == src:
                        sub.rows.append(r)
                        sub.listings.append(l)
                out.append(sub)
        else:
            out.append(g)
    return out, dropped
