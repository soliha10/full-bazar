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
from collections import Counter, defaultdict
from dataclasses import dataclass, field

# Sarlavhani tahlil qilish (lug'at, xotira, nom) matching_parse.py da. Ochiq
# API (parse, display_name, Listing) shu modul orqali ham import qilinadi —
# sync_csv.py va testlar `matching` ni ishlatadi.
from matching_parse import Listing, _canon, display_name, parse  # noqa: F401

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


# ── "Tayyorlov" narxlari ─────────────────────────────────────────────────────
# Ba'zi do'konlar yangi modelning HAMMA xotira variantiga bitta narx qo'yadi
# (sotuv boshlanmagan, narx hali yo'q): Olcha dagi "iPhone Duo" 256 GB, 512 GB
# va 1 TB — uchalasi 24.1 mln. Ular 1 TB li guruhda "eng arzon" bo'lib,
# farqni 64 mln deb ko'rsatardi. Bir do'kon, bir model, kamida 3 xil hajm
# AYNAN bir narxda — bu haqiqiy narx emas. (Ikki hajm bir narxda bo'lishi
# Alif kabi marketplace'larda tez-tez uchraydi va haqiqiy — tegilmaydi.)
PLACEHOLDER_MIN_SIZES = 3


def drop_placeholder_prices(rows: list[dict]) -> tuple[list[dict], int]:
    """(qolgan qatorlar, tashlangan qatorlar soni)"""
    sizes: dict = defaultdict(set)
    parsed = []
    for r in rows:
        l = parse(r["title"])
        key = (r["src"], l.brand, l.model, r["price"]) if l.brand and l.model else None
        if key and l.storage:
            sizes[key].add(l.storage)
        parsed.append((r, key))
    bad = {k for k, s in sizes.items() if len(s) >= PLACEHOLDER_MIN_SIZES}
    kept = [r for r, k in parsed if k not in bad]
    return kept, len(rows) - len(kept)


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
