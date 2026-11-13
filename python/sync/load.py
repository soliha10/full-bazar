"""data/<do'kon>_products.csv larni o'qish: smartfon filtri, eskirgan va soxta e'lonlar."""
from __future__ import annotations

import csv
import os
import re
from collections import Counter
from datetime import datetime

from .common import _annotate
from matching import parse as parse_title


DATA_DIR = os.getenv("DATA_DIR", "./data")


_SMARTPHONE_RE = re.compile(
    r"(iphone|samsung|redmi|xiaomi|oppo|vivo|realme|honor|smartfon|pixel|"
    r"huawei|смартфон|телефон|telefon|spark|tecno|camon|poco|itel|infinix|"
    r"oneplus|motorola|nokia|meizu|blackview|ulefone|umidigi|doogee|cubot|oukitel)",
    re.IGNORECASE,
)
_NOT_SMARTPHONE_RE = re.compile(
    r"(televizor|noutbuk|laptop|planshet|tablet|konditsioner|pylesos|"
    r"changyutgich|holodilnik|sovutgich|kir yuvish|gaz plita|kabel|chehol|"
    r"case|zaryad|charger|adapter|планшет|чехол|кабель|заряд|наушник|quloqchin|"
    r"derzhatel|держатель|holder|shtativ|штатив|power.?bank|аккумулятор внешний|"
    r"powerbank|видеоусилитель|video amplif|earphone|headphone|bluetooth.*speaker|"
    r"kolonka|колонка|garshet|plyonka|screen.*protect|защитное стекло|защитная плёнка|"
    r"cover|\bcase\b|наушники|аудио|aksesuar|aksessuar|аксессуар|наушник|"
    r"soat\b|watch\b|часы\b|часов\b|chasy\b|smartwatch|smart\s*watch|"
    # Uy (simli va DECT) telefonlari — "telefon" so'zi bor, lekin smartfon emas
    r"panasonic|\bkx[\s-]?t|\bdect\b|vtech|vteck|gigaset|statsionar|stasionar|"
    r"стационарн|radiotelefon|радиотелефон|wi-?fi.?телефон|адаптер питания|quvvatlash qurilmasi|"
    # Planshetlar: "Galaxy Tab A7", "MatePad T10", "Redmi Pad Pro", "iPad"
    r"\bgalaxy\s+tab\b|\btab\s+[a-z]?\d|matepad|\bi?pad\b)",
    re.IGNORECASE,
)

# Zaryadlovchi bloklar brend nomi bilan keladi ("Samsung 25W Low Standby") va
# smartfon filtridan o'tib ketadi. Quvvat (W) yozilgan, lekin xotira hajmi
# yozilmagan sarlavha — telefon emas ("... 8/256 GB 67W" esa telefon).
_WATT_RE = re.compile(r"(?<![\d.])\d{2,3}\s*(w|вт)\b", re.IGNORECASE)
_MEMORY_RE = re.compile(r"\d\s*(gb|tb|гб|тб)\b|\d{1,2}\s*/\s*\d{2,4}", re.IGNORECASE)


def is_smartphone(title: str) -> bool:
    if not _SMARTPHONE_RE.search(title) or _NOT_SMARTPHONE_RE.search(title):
        return False
    return not (_WATT_RE.search(title) and not _MEMORY_RE.search(title))


# Faoliyati to'xtagan yoki eskirgan saytlar — bu CSV fayllarini o'tkazib yuboramiz
# brandstore: domen umuman ulanmaydi. olx: barcha so'rovlarga 403 va
# e'lonlardagi ishlatilgan telefonlar narx solishtirishni buzadi.
# Ozon qaytarildi: scrapers/ozon.py haqiqiy Chrome (CDP) orqali antibotdan
# o'tadi va data/ozon_products.csv ni to'ldiradi. U mahalliy yig'iladi
# (python/scrape_ozon_local.py), CI da emas.
_INACTIVE_SITES = {"premier", "wildberries", "prom", "brandstore", "olx"}

# Mahalliy yig'iladigan do'konlar (Ozon) CSV si repoga commit qilinadi va CI
# uni YANGILAMAYDI — ish kuniga 4 marta o'sha faylni qayta o'qiydi. Agar
# mahalliy yig'ish bir necha hafta qilinmasa, sayt eski narxni yangidek
# ko'rsatib turaveradi. Shuning uchun scraper yozgan `<do'kon>_products.meta`
# fayldagi sana tekshiriladi: eskirgan bo'lsa manba butunlay o'tkazib
# yuboriladi — narxsiz qolgan afzal, noto'g'ri narxdan ko'ra.
# (.meta fayli yo'q manbalar — CI da har ish oldidan yangilanadiganlari —
#  har doim o'qiladi.)
MAX_CSV_AGE_DAYS = int(os.getenv("MAX_CSV_AGE_DAYS", "10"))
# Eskirgani uchun ataylab tashlab yuborilgan manbalar (kichik harfda). Ularning
# narxlari bazadan o'chirilishi kerak — pastdagi "scraper yiqildi" himoyasi
# ularni saqlab qolmasligi uchun shu yerda yig'iladi.
STALE_SOURCES: set[str] = set()


def _too_old(meta_path: str) -> int | None:
    """`.meta` dagi ISO sanadan bugungacha nechta kun o'tgan (eskirgan bo'lsa)."""
    try:
        with open(meta_path, encoding="utf-8") as fh:
            stamp = fh.read().strip()
        age = (datetime.now().astimezone() - datetime.fromisoformat(stamp)).days
        return age if age > MAX_CSV_AGE_DAYS else None
    except (OSError, ValueError):
        return None  # o'qib bo'lmadi — to'sib qo'ymaymiz


# ── Soxta (nusxa) telefonlar ──────────────────────────────────────────────────
# Ozon va ba'zi marketplace'larda brend nomini ataylab buzib yozilgan nusxalar
# ko'p: "App!e 18 Pro Max", "GaIaxy S25 Ultra", "H0N0R 600", "Samsvng",
# "IP17PROMAX" — "1 TB" li "iPhone" ~1 mln so'mga. Ular haqiqiy modellar bilan
# bitta guruhga tushib, "eng arzon narx" sifatida ko'rinardi va mahsulot
# sahifasida foydalanuvchini aldardi. 2026-10-10 da 5509 tadan 290 ga yaqini
# shunday edi (deyarli hammasi Ozon).
_FAKE_BRAND_RE = re.compile(
    r"app[!1|]e|\bh0n0r|\bh0nor|\bhon0r|\bp0c0|\bpoc0|\bp0co|samsvng|samsumg|"
    r"galxy|galxay|\btenco\b|\btecn0\b|x1ao ?mi|xia0mi|xiaom1|redm1|samsun9|"
    r"\biphome|\baphone|\bip ?1[5-9] ?pro ?max|\bi ?1[5-9] ?pro ?max|\bi1[5-9]pro",
    re.I)
# Kichik "l" o'rniga katta "I" (GaIaxy, ApIe) — registr muhim
_FAKE_BRAND_CASE_RE = re.compile(r"Ga[I1]axy|GA1AXY|ApIe|AppIe")
# 1 TB va undan katta xotira ("16/1 ТБ", "2 TB")
_TB_RE = re.compile(r"(?<!\d)[12]\s*(тб|tb)\b", re.I)
_FLAGSHIP_RE = re.compile(r"iphone 1[3-9]|pro max|ultra|galaxy s2\d|galaxy z|\bfold", re.I)


def fake_reason(title: str, price: float) -> str | None:
    """Nusxa telefon bo'lsa — sababi, aks holda None."""
    if _FAKE_BRAND_RE.search(title) or _FAKE_BRAND_CASE_RE.search(title):
        return "buzilgan brend nomi"
    # Haqiqiy 1 TB li smartfon 4 mln so'mdan ancha qimmat
    if _TB_RE.search(title) and price < 4_000_000:
        return "1 TB arzon narxda"
    # Flagman nomi (iPhone 13+, Pro Max, Ultra, Galaxy S/Z) 2 mln so'mdan arzon
    if _FLAGSHIP_RE.search(title) and price < 2_000_000:
        return "flagman nomi, nusxa narxi"
    return None


def unidentified(title: str) -> bool:
    """
    Sarlavhada model nomi yo'q: "Смартфон 12/512 ГБ, Nano-SIM, бордовый" yoki
    noma'lum brend va raqamsiz "Hyundai Смартфон 8/256". Bunday e'lonni hech
    qaysi model bilan solishtirib bo'lmaydi — katalogda "12/512 GB" nomli
    mahsulot bo'lib chiqardi (2026-11-13 da 96 ta).
    """
    listing = parse_title(title)
    if not listing.model:
        return True
    return not listing.brand and not any(ch.isdigit() for w in listing.model for ch in w)


def load_rows():
    rows = []
    fakes: Counter = Counter()
    unnamed: Counter = Counter()
    # FAQAT scraper chiqarigan "<do'kon>_products.csv" fayllari.
    # Ilgari papkadagi HAR QANDAY .csv o'qilardi va bu ikki xatoga olib kelardi:
    #   · data/olcha_phones.csv — bir yil oldingi eskirgan narxlar. Manba nomi
    #     baribir "olcha" bo'lgani uchun ular yangi narxlar bilan bitta guruhga
    #     tushib, eng arzoni sifatida ko'rsatilardi.
    #   · ML uchun yig'ilgan synthetic/processed_matching_data.csv — ular faqat
    #     tasodifan o'tib ketmasdi (ustun nomlari boshqacha).
    for fn in sorted(os.listdir(DATA_DIR)):
        if not fn.endswith("_products.csv"):
            continue
        src_fallback = fn.replace("_products.csv", "").replace("-", "_").split("_")[0]
        # Faoliyati to'xtagan saytlarni o'tkazib yuboramiz
        if src_fallback.lower() in _INACTIVE_SITES:
            print(f"[sync] Skipping inactive site: {fn}", flush=True)
            continue
        stale = _too_old(os.path.join(DATA_DIR, fn.replace(".csv", ".meta")))
        if stale is not None:
            # Oddiy `print` emas: bu butun bir do'konning narxlari saytdan
            # tushib qolishini bildiradi. Ozon 2026-09-18 dan buyon aynan
            # shunday jim tashlab yuborilgan edi — Actions sahifasida hech
            # qanday belgi yo'q edi.
            _annotate("warning",
                      f"{fn} eskirgan ({stale} kun oldin yig'ilgan, chegara "
                      f"{MAX_CSV_AGE_DAYS} kun) — bu do'kon narxlari saytda "
                      f"ko'rinmaydi. Mahalliy yig'ib repoga commit qiling.")
            STALE_SOURCES.add(src_fallback.lower())
            continue
        fpath = os.path.join(DATA_DIR, fn)
        try:
            with open(fpath, encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames:
                    continue
                reader.fieldnames = [(h.lower().strip() if h else "") for h in reader.fieldnames]
                for row in reader:
                    title = (row.get("title") or row.get("product_name") or row.get("name") or "").strip()
                    if not title or not is_smartphone(title):
                        continue
                    raw = row.get("actual_price") or row.get("price") or "0"
                    pstr = str(raw).lower()
                    if "oyiga" in pstr or " x " in pstr:
                        raw = row.get("old_price") or raw
                    price = float(re.sub(r"[^\d.]", "", str(raw).replace(" ", "")) or 0)
                    if price < 100_000:
                        continue
                    if fake_reason(title, price):
                        fakes[src_fallback] += 1
                        continue
                    if unidentified(title):
                        unnamed[src_fallback] += 1
                        continue
                    rows.append({
                        "title": title,
                        "image": (row.get("image_url") or row.get("image") or row.get("img") or "").strip(),
                        "src": (row.get("store") or row.get("market") or row.get("source") or src_fallback).lower(),
                        "price": price,
                        "url": (row.get("product_url") or row.get("url") or row.get("link") or "#").strip().replace("\n", ""),
                        "rating": row.get("rating"),
                        "reviews": row.get("review_count") or row.get("reviews"),
                    })
        except Exception as exc:
            print(f"  skip {fn}: {exc}", flush=True)
    if unnamed:
        print(f"[sync] model nomi yo'q e'lonlar tashlandi: {sum(unnamed.values())} ta — "
              + ", ".join(f"{k} {v}" for k, v in unnamed.most_common()), flush=True)
    if fakes:
        print(f"[sync] soxta (nusxa) telefonlar tashlandi: {sum(fakes.values())} ta — "
              + ", ".join(f"{k} {v}" for k, v in fakes.most_common()), flush=True)
    return rows
