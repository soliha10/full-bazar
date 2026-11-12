"""CSV → PostgreSQL sinxronizatsiyasi. GitHub Actions ishga tushiradi."""
from __future__ import annotations
import csv, hashlib, math, os, re, sys, time, unicodedata
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import urlsplit

import psycopg2, psycopg2.extras

import matching

DATA_DIR = os.getenv("DATA_DIR", "./data")

# Docker compose dagi mahalliy baza — faqat zaxira qiymat.
LOCAL_DB_URL = "postgresql://postgres:postgres@postgres:5432/fullbazar"

# DIQQAT: `os.getenv(nom, zaxira)` BO'SH satrni ham haqiqiy qiymat deb oladi.
# 2026-09-28 da SUPABASE_DB_URL siri bo'sh qiymat bilan qayta yozilgan va
# natijada bu yerga "" tushgan: psycopg2 bo'sh DSN ni "mahalliy Unix soket"
# deb tushunib, runner ichidagi yo'q PostgreSQL ga ulanishga urinardi
# (`/var/run/postgresql/.s.PGSQL.5432 ... No such file or directory`). Xato
# xabari sirga umuman ishora qilmagani uchun muammo bir hafta sezilmadi.
# Shuning uchun bo'sh/probellardan iborat qiymat BERILMAGAN deb qaraladi.
DB_URL = os.getenv("PRODUCTS_DB_URL", "").strip() or LOCAL_DB_URL

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
    r"soat\b|watch\b|часы\b|часов\b|chasy\b|smartwatch|smart\s*watch)",
    re.IGNORECASE,
)

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

# Scraper yiqilib, do'kon odatdagidan ancha kam mahsulot bersa (masalan alif
# sahifasi timeout bo'ldi), o'sha do'konning bazadagi narxlari o'chirilmaydi —
# aks holda yuzlab mahsulot o'chib, keyingi ishda qayta yozilardi (2026-10-23:
# 3131 → 2314 → 3131). Saqlangan narxlar PROTECT_MAX_AGE dan eskirsa baribir
# o'chadi, ya'ni butunlay buzilgan scraper eski narxni abadiy ko'rsatmaydi.
DROP_RATIO = 0.5
DROP_MIN_ROWS = 20
PROTECT_MAX_AGE = "2 days"


def _annotate(level: str, message: str) -> None:
    """GitHub Actions ogohlantirishi (mahalliy ishda oddiy satr)."""
    if os.getenv("GITHUB_ACTIONS") == "true":
        print(f"::{level}::{message}", flush=True)
    else:
        print(f"[{level}] {message}", flush=True)


def _too_old(meta_path: str) -> int | None:
    """`.meta` dagi ISO sanadan bugungacha nechta kun o'tgan (eskirgan bo'lsa)."""
    try:
        with open(meta_path, encoding="utf-8") as fh:
            stamp = fh.read().strip()
        age = (datetime.now().astimezone() - datetime.fromisoformat(stamp)).days
        return age if age > MAX_CSV_AGE_DAYS else None
    except (OSError, ValueError):
        return None  # o'qib bo'lmadi — to'sib qo'ymaymiz
def _norm(title):
    n = title.lower()
    n = re.sub(r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni|телефон)\s+", "", n, flags=re.IGNORECASE)
    n = re.sub(r"[.,\/#!$%\^&\*;:{}=\-_`~()]", " ", n)
    return re.sub(r"\s+", " ", n).strip() or title.lower().strip()


def _display(title):
    n = re.sub(r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+", "", title, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", n).strip()


# ── URL slug ─────────────────────────────────────────────────────────────────
# Mahsulot manzili faqat nomdan iborat bo'lishi kerak: /product/iphone-15-128gb
# emas, /product/iphone-15-128gb-prod-8fc7e81f5ca9. Shuning uchun slug bazada
# ustun sifatida saqlanadi va API uni ID bilan barobar qabul qiladi.
#
# frontend/src/utils/slug.ts dagi slugify BILAN BIR XIL natija berishi kerak —
# ikkalasi ham kirillchani lotinga o'giradi va 70 belgida kesadi.
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    # o'zbek kirillchasiga xos harflar
    "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}


def _slugify(text: str) -> str:
    out = []
    for ch in (text or "").lower():
        out.append(_CYRILLIC.get(ch, ch))
    value = unicodedata.normalize("NFD", "".join(out))
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    value = re.sub(r"['\u2019`]", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:70].rstrip("-")


def assign_slugs(groups, existing: dict | None = None):
    """
    Har bir guruhga takrorlanmaydigan slug beradi.

    Slug — mahsulotning ommaviy manzili, shuning uchun u BIR MARTA berilib,
    keyin o'zgarmasligi kerak. Ikkita xavf bor:

      1. Nomlar takrorlanadi (turli do'kon bir xil sarlavha yozadi, yoki rang
         nomda ko'rsatilmagan), URL esa yagona bo'lishi shart. To'qnashuvda
         ID ning qisqa bo'lagi qo'shiladi — tasodifiy tartibga bog'liq
         "-2"/"-3" qo'shimchalaridan farqli o'laroq, bu keyingi
         sinxronizatsiyada ham AYNAN o'sha slugni beradi.
      2. `title` — guruhdagi ENG UZUN do'kon sarlavhasi. Yangi do'kon undan
         ham uzun sarlavha bilan qo'shilsa, nom o'zgarib slug ham o'zgarardi
         va tarqalgan havolalar 404 bo'lardi. Shuning uchun bazada allaqachon
         slugi bor mahsulot O'SHA slugini saqlab qoladi.
    """
    existing = existing or {}
    used: set[str] = set()

    # 1) Oldin berilgan sluglar — ular hech qachon o'zgarmaydi
    for pid in sorted(groups):
        old_slug = existing.get(pid)
        if old_slug and old_slug not in used:
            groups[pid]["slug"] = old_slug
            used.add(old_slug)

    # 2) Yangi mahsulotlarga slug beramiz. ID bo'yicha tartib — natija
    #    sinxronizatsiyadan sinxronizatsiyaga barqaror.
    for pid in sorted(groups):
        g = groups[pid]
        if g.get("slug"):
            continue
        # Nom rangsiz ("samsung-galaxy-a55-5g-8-128-gb"), sarlavha esa bir
        # do'konning rangli yozuvi — slug nomdan olinadi
        base = _slugify(g["name"]) or _slugify(g["title"]) or pid
        slug = base
        if slug in used:
            suffix = pid.replace("prod-", "")[:6]
            slug = f"{base[:70 - len(suffix) - 1]}-{suffix}"
            # Nihoyatda kam uchraydi: bir xil nom + bir xil ID prefiksi
            n = 2
            while slug in used:
                slug = f"{base[:66]}-{suffix}-{n}"
                n += 1
        used.add(slug)
        g["slug"] = slug
    return groups


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


def load_rows():
    rows = []
    fakes: Counter = Counter()
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
                    if not title or not _SMARTPHONE_RE.search(title) or _NOT_SMARTPHONE_RE.search(title):
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
    if fakes:
        print(f"[sync] soxta (nusxa) telefonlar tashlandi: {sum(fakes.values())} ta — "
              + ", ".join(f"{k} {v}" for k, v in fakes.most_common()), flush=True)
    return rows


def build_groups(rows):
    """
    E'lonlarni mahsulotlarga guruhlaydi: brend + model + xotira, rang — variant
    (qoidalar python/matching.py da, sinovlari tests/test_matching.py da).

    Ilgari butun sarlavha kosinus o'xshashligi bilan solishtirilar va har bir
    rang alohida mahsulot edi: 2026-11-12 da e'lonlarning atigi 13% i bir
    nechta do'konda bor mahsulotga tushardi, yangi qoidalar bilan ~72%.
    """
    # Natija qatorlar tartibiga bog'liq bo'lmasin (rasm/sarlavha birinchidan
    # olinadi) — aks holda har sinxronizatsiya mahsulotlarni "o'zgargan" deb
    # qayta yozardi.
    rows = sorted(rows, key=lambda r: (_norm(r["title"]), r["src"], r["price"],
                                       r["url"], r["image"], r["title"]))
    clustered, dropped = matching.drop_price_outliers(matching.group_rows(rows))
    if dropped:
        print(f"[sync] narxi g'ayritabiiy {dropped} ta taklif chiqarildi "
              f"(guruh medianasidan {matching.OUTLIER_FACTOR:g} barobar farq)", flush=True)

    groups = {}
    for cl in clustered:
        if not cl.rows:
            continue
        pid = cl.pid
        first = cl.rows[0]
        rating = None
        if first["rating"]:
            try:
                r = float(first["rating"])
                if 1 <= r <= 5:
                    rating = round(r, 2)
            except (ValueError, TypeError):
                pass
        reviews = None
        if first["reviews"]:
            try:
                reviews = int(first["reviews"])
            except (ValueError, TypeError):
                pass
        g = groups[pid] = {
            "id": pid,
            # Rangsiz, toza nom: "Samsung Galaxy A55 5G 8/128 GB"
            "name": matching.display_name(cl.best_listing()) or _display(first["title"]),
            "title": first["title"], "rating": rating, "reviews": reviews,
            "image": first["image"], "images": [], "keywords": set(), "markets": {},
            # Har bir do'kon sahifasi — eski mahsulot ID sini topish uchun (aliaslar)
            "members": set(),
        }
        for row in cl.rows:
            if len(row["title"]) > len(g["title"]):
                g["title"] = row["title"]
            g["keywords"].add(row["title"].lower())
            if row["image"] and row["image"] not in g["images"]:
                g["images"].append(row["image"])
            if row["image"] and not g["image"]:
                g["image"] = row["image"]
            g["members"].add((row["src"].lower(), row["url"]))
            src, price = row["src"], row["price"]
            if src not in g["markets"] or price < g["markets"][src]["price"]:
                g["markets"][src] = {"source": src.capitalize(), "price": price, "url": row["url"]}
    for g in groups.values():
        # Takroriy sarlavhalar keywords ni 5 KB gacha shishirardi
        g["keywords"] = " ".join(sorted(g["keywords"]))
    return groups


SLUG_DDL = (
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(200)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)",
    # _write_rows narxlarni (product_id, source) bo'yicha UPSERT qiladi
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_markets_product_source "
    "ON product_markets(product_id, source)",
)


def load_existing_slugs(conn) -> dict:
    """{product_id: slug} — oldingi sinxronizatsiyada berilgan manzillar."""
    with conn.cursor() as cur:
        _apply_timeouts(cur)
        # ALTER TABLE ... IF NOT EXISTS ham, CREATE INDEX ... IF NOT EXISTS ham
        # ustun/indeks BOR bo'lsa-da avval jadval qulfini oladi (ALTER —
        # ACCESS EXCLUSIVE). Qulf navbatida turgan buyruq orqasida saytning
        # o'qishlari ham to'xtaydi, shuning uchun faqat haqiqatan yo'q
        # bo'lganda bajaramiz.
        cur.execute("""
            SELECT
              EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'products' AND column_name = 'slug'),
              EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_slug'),
              EXISTS (SELECT 1 FROM pg_indexes
                      WHERE indexname = 'idx_product_markets_product_source')
        """)
        for stmt, present in zip(SLUG_DDL, cur.fetchone()):
            if not present:
                cur.execute(stmt)
        cur.execute("SELECT id, slug FROM products WHERE slug IS NOT NULL")
        return dict(cur.fetchall())


# ── Supabase ga ulanish ───────────────────────────────────────────────────────
# CI dagi ishlar muntazam ikki xil xato bilan tushardi:
#
#   psycopg2.OperationalError: ... (ECHECKOUTTIMEOUT) unable to check out
#   connection from the pool after 15000ms in Session mode
#       → pooler band edi. Bu vaqtinchalik holat: bir necha soniyadan keyin
#         qayta urinish yetadi, lekin kod birinchi urinishdayoq tushardi.
#
#   psycopg2.errors.QueryCanceled: canceling statement due to statement timeout
#       → bepul Supabase sekin: 5500 qatorlik INSERT server tomondagi sukut
#         bo'yicha chegaradan oshib ketardi. Sessiyaga o'z chegaramizni
#         qo'yamiz va partiyalarni kichraytiramiz.
CONNECT_ATTEMPTS = 5
CONNECT_BACKOFF = (5, 15, 30, 60)

# Bitta buyruq uchun. 5500 qatorlik yozuvga yetarli, lekin cheksiz emas —
# osilib qolgan buyruq CI ni 60 daqiqa ushlab turmasin.
STATEMENT_TIMEOUT_MS = 10 * 60 * 1000
# Qulf kutish cheki (DDL va DELETE uchun) — kutish butun byudjetni yemasin.
LOCK_TIMEOUT_MS = 60 * 1000
# Tranzaksiya ochiq turib, kod tomonda nimadir osilib qolsa — pooler dagi
# ulanishni band qilib qo'ymaslik uchun.
IDLE_TX_TIMEOUT_MS = 5 * 60 * 1000


def connect():
    """Supabase ga ulanadi; pooler band bo'lsa kutib qayta uriniladi."""
    last: Exception | None = None
    for attempt in range(CONNECT_ATTEMPTS):
        try:
            conn = psycopg2.connect(
                DB_URL,
                connect_timeout=30,
                # Uzoq INSERT paytida NAT/pooler ulanishni jim o'ldirmasin
                keepalives=1, keepalives_idle=30,
                keepalives_interval=10, keepalives_count=5,
            )
        except psycopg2.OperationalError as exc:
            last = exc
            # Noto'g'ri parol vaqtinchalik emas — kutib qayta urinish faqat
            # 2 daqiqani behuda yeydi.
            if "password authentication failed" in str(exc):
                _annotate("error", "Supabase parolni rad etdi — SUPABASE_DB_URL "
                          "dagi parol bazaning joriy paroliga mos emas.")
                break
            if "tenant/user" in str(exc):
                _annotate("error", "pooler bunday loyihani topmadi — "
                          "`postgres.<project-ref>` dagi ref noto'g'ri.")
                break
            if attempt == CONNECT_ATTEMPTS - 1:
                break
            wait = CONNECT_BACKOFF[attempt]
            print(f"[db] ulanmadi ({str(exc).strip()}) — {wait}s dan keyin "
                  f"qayta urinish ({attempt + 2}/{CONNECT_ATTEMPTS})", flush=True)
            time.sleep(wait)
            continue

        # Sessiya darajasida qo'yamiz — 5432-portdagi SESSION rejimida shu
        # yetadi. Pooler rad etsa to'xtamaymiz: server sukuti ham ishlaydi,
        # qolaversa har tranzaksiya ichida SET LOCAL bilan takrorlanadi.
        conn.autocommit = True
        for name, value in _TIMEOUTS:
            try:
                with conn.cursor() as cur:
                    cur.execute(f"SET {name} = {value}")
            except psycopg2.Error as exc:
                print(f"[db] {name} o'rnatilmadi: {str(exc).strip()[:120]}",
                      flush=True)
        # Pooler ulanishni qabul qilib, birinchi buyruqdayoq uzishi mumkin
        # ("SSL connection has been closed unexpectedly"). Bu ham vaqtinchalik
        # — yopiq ulanishni qaytarmasdan, qaytadan ulanamiz.
        if conn.closed:
            last = psycopg2.OperationalError("ulanish birinchi buyruqda uzildi")
            if attempt == CONNECT_ATTEMPTS - 1:
                break
            wait = CONNECT_BACKOFF[attempt]
            print(f"[db] ulanish uzildi — {wait}s dan keyin qayta urinish "
                  f"({attempt + 2}/{CONNECT_ATTEMPTS})", flush=True)
            time.sleep(wait)
            continue
        conn.autocommit = False
        return conn

    raise last  # type: ignore[misc]


_TIMEOUTS = (
    ("statement_timeout", STATEMENT_TIMEOUT_MS),
    ("lock_timeout", LOCK_TIMEOUT_MS),
    ("idle_in_transaction_session_timeout", IDLE_TX_TIMEOUT_MS),
)


def _apply_timeouts(cur) -> None:
    """Chegaralarni JORIY TRANZAKSIYA uchun qo'yadi.

    DSN pooler ning TRANSACTION rejimiga (6543-port) ko'chirilsa, ulanish
    paytidagi `SET` saqlanmaydi: u yerda har tranzaksiya boshqa server
    ulanishiga tushishi mumkin. `SET LOCAL` esa ikkala rejimda ham ishlaydi,
    shuning uchun chegaralar portga bog'liq bo'lmay qoladi.
    """
    for name, value in _TIMEOUTS:
        cur.execute(f"SET LOCAL {name} = {value}")


# Yozish tranzaksiyasi tushishi mumkin bo'lgan, o'tkinchi sabablar: qulf
# kutilmadi (saytning o'qish so'rovlari TRUNCATE ni to'sib turibdi), buyruq
# chegaradan oshdi, yoki ulanish uzildi. Ularning hammasi bir necha daqiqadan
# keyin o'tib ketadi — butun ishni tashlash o'rniga qayta uriniladi.
WRITE_ATTEMPTS = 3
WRITE_BACKOFF = (30, 90)
# QueryCanceled (statement/lock timeout), LockNotAvailable, DeadlockDetected
# va uzilgan ulanish — hammasi OperationalError ning avlodlari.
_RETRYABLE = psycopg2.OperationalError


def write_db(groups):
    conn = connect()
    try:
        # Sluglarni jadval tozalanishidan oldin o'qiymiz: mahsulotning manzili bir marta
        # berilib, keyin o'zgarmasligi kerak.
        with conn:
            assign_slugs(groups, load_existing_slugs(conn))

        for attempt in range(WRITE_ATTEMPTS):
            try:
                return _write_rows(conn, groups)
            except _RETRYABLE as exc:
                if attempt == WRITE_ATTEMPTS - 1:
                    raise
                wait = WRITE_BACKOFF[attempt]
                print(f"[db] yozish tushdi ({type(exc).__name__}: "
                      f"{str(exc).strip()[:150]}) — {wait}s dan keyin qayta "
                      f"urinish ({attempt + 2}/{WRITE_ATTEMPTS})", flush=True)
                # Ulanish uzilgan bo'lishi mumkin — yangisini olamiz.
                try:
                    conn.close()
                except psycopg2.Error:
                    pass
                time.sleep(wait)
                conn = connect()
    finally:
        conn.close()


# products ning sinxronizatsiya yozadigan ustunlari (id va updated_at dan
# tashqari). Qator faqat shulardan biri o'zgarsa yangilanadi.
_PRODUCT_COLS = ("slug", "name", "title", "category", "rating", "reviews",
                 "image", "images", "in_stock", "keywords", "source", "price",
                 "url")


def _protected_sources(cur, groups) -> list[str]:
    """Bu safar odatdagidan keskin kam e'lon bergan do'konlar (kichik harfda).

    Do'kon bo'yicha scraper YIG'GAN e'lonlar soni (CSV qatorlari) solishtiriladi,
    product_markets qatorlari emas: guruhlash qoidasi o'zgarganda (masalan,
    ranglar bitta mahsulotga birlashganda) narx qatorlari qonuniy ravishda
    kamayadi va har bir do'kon "scraper yiqilgan" deb noto'g'ri himoyalanardi.
    """
    new_counts = Counter(src for g in groups.values() for src, _ in g.get("members", ()))
    # Oldingi sinxronizatsiyadagi e'lonlar soni (shu funksiya yozadi, pastga
    # qarang). Yozuvi yo'q do'kon uchun — product_markets qatorlari: eski
    # guruhlashda ular e'lonlar soniga deyarli teng edi.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS source_listings (
            source     VARCHAR(100) PRIMARY KEY,
            listings   INTEGER      NOT NULL,
            updated_at TIMESTAMPTZ  DEFAULT NOW()
        )
    """)
    cur.execute("SELECT source, listings FROM source_listings "
                f"WHERE updated_at > NOW() - INTERVAL '{PROTECT_MAX_AGE}'")
    baseline = dict(cur.fetchall())
    cur.execute(
        "SELECT lower(source), count(*) FROM product_markets "
        f"WHERE created_at > NOW() - INTERVAL '{PROTECT_MAX_AGE}' GROUP BY 1"
    )
    for src, n in cur.fetchall():
        baseline.setdefault(src, n)
    protected = []
    for src, old in sorted(baseline.items()):
        if src in STALE_SOURCES or old < DROP_MIN_ROWS:
            continue
        if new_counts.get(src, 0) < old * DROP_RATIO:
            protected.append(src)
            _annotate("warning",
                      f"{src}: {new_counts.get(src, 0)} ta e'lon (avval {old}) — "
                      f"scraper yiqilgan ko'rinadi, eski narxlar saqlab qolindi.")
    # Keyingi safar shu bilan solishtiriladi. Himoyalangan do'konning eski
    # (sog'lom) soni saqlanadi — aks holda yiqilgan natija "me'yor" bo'lib qolardi.
    healthy = [(src, n) for src, n in new_counts.items() if src not in protected]
    if healthy:
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO source_listings (source, listings, updated_at) VALUES %s "
            "ON CONFLICT (source) DO UPDATE SET listings = EXCLUDED.listings, updated_at = NOW()",
            [(src, n, datetime.now(timezone.utc)) for src, n in healthy],
        )
    return protected


def _migrate_ids(cur, groups) -> None:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS product_aliases (
            old_id     VARCHAR(60)  PRIMARY KEY,
            new_id     VARCHAR(60)  NOT NULL,
            old_slug   VARCHAR(200),
            created_at TIMESTAMPTZ  DEFAULT NOW()
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_product_aliases_slug ON product_aliases(old_slug)")

    cur.execute("SELECT product_id, lower(source), url FROM product_markets")
    owner = {(src, url): pid for pid, src, url in cur.fetchall()}
    votes: dict[str, Counter] = {}
    for pid, g in groups.items():
        for member in g.get("members", ()):
            old = owner.get(member)
            if old and old != pid:
                votes.setdefault(old, Counter())[pid] += 1
    new_ids = set(groups)
    # Eski mahsulot e'lonlarining ko'pi qaysi yangisiga o'tgan bo'lsa — o'sha
    pairs = {old: c.most_common(1)[0][0] for old, c in votes.items() if old not in new_ids}

    # Avval tirik mahsulot bo'lib qaytgan ID lar alias bo'lib qolmasin
    cur.execute("DELETE FROM product_aliases WHERE old_id = ANY(%s)", (list(new_ids),))
    if not pairs:
        return
    olds, news = list(pairs), [pairs[o] for o in pairs]
    cur.execute("SELECT id, slug FROM products WHERE id = ANY(%s)", (olds,))
    slugs = dict(cur.fetchall())

    cur.execute("CREATE TEMP TABLE _alias_map (old VARCHAR(60) PRIMARY KEY, new VARCHAR(60) NOT NULL) ON COMMIT DROP")
    psycopg2.extras.execute_values(cur, "INSERT INTO _alias_map (old, new) VALUES %s", list(zip(olds, news)))
    psycopg2.extras.execute_values(
        cur,
        "INSERT INTO product_aliases (old_id, new_id, old_slug) VALUES %s "
        "ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id, "
        "old_slug = COALESCE(EXCLUDED.old_slug, product_aliases.old_slug)",
        [(o, n, slugs.get(o)) for o, n in zip(olds, news)],
    )
    # Zanjir: oldingi sinxronizatsiyadagi aliaslar endi alias bo'lgan ID ga
    # ko'rsatayotgan bo'lsa — to'g'ridan-to'g'ri yangisiga
    cur.execute("UPDATE product_aliases a SET new_id = m.new FROM _alias_map m WHERE a.new_id = m.old")

    moved = {}
    cur.execute("UPDATE price_history h SET product_id = m.new FROM _alias_map m WHERE h.product_id = m.old")
    moved["price_history"] = cur.rowcount
    for table in ("user_events",):
        cur.execute("SELECT to_regclass(%s)", (table,))
        if cur.fetchone()[0]:
            cur.execute(f"UPDATE {table} t SET product_id = m.new FROM _alias_map m WHERE t.product_id = m.old")
            moved[table] = cur.rowcount
    # Sevimlilar / kuzatuv: (user_id, product_id) kalit. Foydalanuvchi bitta
    # modelning ikki rangini saqlagan bo'lsa, ular bitta yozuvga aylanadi.
    for table in ("user_favorites", "user_watchlist"):
        cur.execute("SELECT to_regclass(%s)", (table,))
        if not cur.fetchone()[0]:
            continue
        cur.execute(f"""
            INSERT INTO {table} (user_id, product_id, product_data, created_at)
            SELECT DISTINCT ON (t.user_id, m.new) t.user_id, m.new, t.product_data, t.created_at
            FROM {table} t JOIN _alias_map m ON t.product_id = m.old
            ORDER BY t.user_id, m.new, t.created_at
            ON CONFLICT (user_id, product_id) DO NOTHING
        """)
        cur.execute(f"DELETE FROM {table} t USING _alias_map m WHERE t.product_id = m.old")
        moved[table] = cur.rowcount
    print(f"[alias] {len(pairs)} ta eski mahsulot yangisiga bog'landi; ko'chirildi: "
          + ", ".join(f"{k} {v}" for k, v in moved.items()), flush=True)


def _write_rows(conn, groups):
    prod_rows, mkt_rows = [], []
    now = datetime.now(timezone.utc)
    for pid, g in groups.items():
        sm = sorted(g["markets"].values(), key=lambda m: m["price"])
        best = sm[0] if sm else {}
        prod_rows.append((
            pid, g["slug"], g["name"], g["title"], "Phones",
            g["rating"], g["reviews"], g["image"] or None,
            g["images"] or None, True, g["keywords"][:5000],
            best.get("source"), best.get("price", 0), best.get("url"),
            # utcnow() naive qiymat beradi va TIMESTAMPTZ ustunida uni server
            # o'z mintaqasida talqin qiladi. Aniq UTC yozamiz.
            now,
        ))
        for m in sm:
            mkt_rows.append((pid, m["source"], m["price"], m["url"]))

    with conn:
        with conn.cursor() as cur:
            _apply_timeouts(cur)
            # ── Narx tarixi ─────────────────────────────────────────────────
            # product_markets tozalanishidan OLDIN joriy narxlarni
            # saqlab qolamiz. Buni shu yerda qilish shart: sinxronizatsiya
            # jadvalni har safar to'liq qayta yozadi, ya'ni snapshot olinmasa
            # eski narxlar butunlay yo'qoladi va Tahlil sahifasi ham, narx
            # grafigi ham bo'sh qoladi.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id          BIGSERIAL      PRIMARY KEY,
                    product_id  VARCHAR(60)    NOT NULL,
                    source      VARCHAR(100)   NOT NULL,
                    price       DECIMAL(15, 2) NOT NULL,
                    recorded_at TIMESTAMPTZ    DEFAULT NOW()
                )
            """)
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_price_history_product "
                "ON price_history(product_id, recorded_at DESC)"
            )
            # Faqat narxi O'ZGARGANLARINI yozamiz. Har safar hammasini yozsak,
            # kuniga ~22 ming qator qo'shilib, Supabase'ning bepul 500 MB
            # chegarasi bir necha oyda to'lib qolardi.
            cur.execute("""
                WITH latest AS (
                    SELECT DISTINCT ON (product_id, source)
                           product_id, source, price
                    FROM price_history
                    ORDER BY product_id, source, recorded_at DESC
                )
                INSERT INTO price_history (product_id, source, price, recorded_at)
                SELECT pm.product_id, pm.source, pm.price, NOW()
                FROM product_markets pm
                LEFT JOIN latest l
                       ON l.product_id = pm.product_id AND l.source = pm.source
                WHERE l.price IS NULL OR l.price <> pm.price
            """)
            snapshots = cur.rowcount

            # Eskilarini tozalab turamiz — tahlil uchun 180 kun yetarli
            cur.execute(
                "DELETE FROM price_history "
                "WHERE recorded_at < NOW() - INTERVAL '180 days'"
            )
            print(f"[history] {snapshots} ta narx o'zgarishi yozildi, "
                  f"{cur.rowcount} ta eski yozuv o'chirildi", flush=True)

            # ── Eski ID -> yangi ID (aliaslar) ──────────────────────────────
            # Guruhlash qoidasi o'zgarsa (yoki do'kon yangi ma'lumot qo'shib,
            # model kaliti o'zgarsa) mahsulot ID si o'zgaradi. Eski ID li
            # mahsulot pastda o'chiriladi va unga bog'langan hamma narsa —
            # Google dagi havolalar, sevimlilar, narx kuzatuvi, narx tarixi —
            # osilib qolardi. Shuning uchun har bir eski mahsulot uning
            # e'lonlari (do'kon + URL) qaysi yangi mahsulotga o'tganiga qarab
            # yangisiga bog'lanadi va bog'liq jadvallar ko'chiriladi.
            _migrate_ids(cur, groups)

            # ── Faqat O'ZGARGANINI yozamiz ──────────────────────────────────
            # Ilgari har safar ikkala jadval to'liq o'chirilib, 5500 mahsulot
            # qaytadan yozilardi. products da to'rtta GIN indeks bor (nom va
            # 5 KB gacha keywords bo'yicha trigram/tsvector) — har yozuv ularni
            # qayta qurdirardi. Bepul Supabase ning disk resursi shunga ketib,
            # yozish 30+ daqiqa cho'zilar va shu vaqt saytning o'qish so'rovlari
            # ham kutib qolardi. Aslida har sinxronizatsiyada bir necha o'nlab
            # narx o'zgaradi xolos.
            #   1. yo'qolgan mahsulotlar o'chiriladi (yangi slug ular bilan
            #      to'qnashmasligi uchun UPSERT dan OLDIN);
            #   2. products — UPSERT, lekin qator faqat biror maydoni farq
            #      qilsa yangilanadi (WHERE ... IS DISTINCT FROM) — o'zgarmagan
            #      qator uchun yangi kortej ham, indeks yozuvi ham yo'q;
            #   3. product_markets — tor jadval, GIN siz: UPSERT + eskilarini
            #      o'chirish. created_at har safar yangilanadi — sahifadagi
            #      "tekshirilgan" vaqti shundan olinadi.
            ids = [r[0] for r in prod_rows]
            protected = _protected_sources(cur, groups)
            # Yangi ro'yxatda yo'q narxlar — himoyalangan do'konnikidan tashqari
            cur.execute(
                "DELETE FROM product_markets pm WHERE NOT EXISTS ("
                " SELECT 1 FROM unnest(%s::text[], %s::text[]) AS n(pid, src)"
                " WHERE n.pid = pm.product_id AND n.src = pm.source)"
                " AND NOT (lower(pm.source) = ANY(%s)"
                f"          AND pm.created_at > NOW() - INTERVAL '{PROTECT_MAX_AGE}')",
                ([m[0] for m in mkt_rows], [m[1] for m in mkt_rows], protected),
            )
            stale = cur.rowcount
            # Mahsulot faqat birorta ham narxi qolmaganda o'chadi
            cur.execute(
                "DELETE FROM products p WHERE NOT (p.id = ANY(%s)) AND NOT EXISTS ("
                " SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id)",
                (ids,),
            )
            removed = cur.rowcount

            # Himoya tufayli qolgan mahsulotlar o'z slugini band qilib turadi.
            # O'sha slugni olgan yangi guruhga ID qo'shimchasini beramiz
            # (assign_slugs dagi to'qnashuv qoidasi bilan bir xil).
            cur.execute("SELECT slug FROM products WHERE NOT (id = ANY(%s)) "
                        "AND slug IS NOT NULL", (ids,))
            kept = {r[0] for r in cur.fetchall()}
            if kept:
                used = {r[1] for r in prod_rows} | kept
                for i, r in enumerate(prod_rows):
                    if r[1] not in kept:
                        continue
                    suffix = r[0].replace("prod-", "")[:6]
                    slug, n = f"{r[1][:70 - len(suffix) - 1]}-{suffix}", 2
                    while slug in used:
                        slug = f"{r[1][:66]}-{suffix}-{n}"
                        n += 1
                    used.add(slug)
                    prod_rows[i] = r[:1] + (slug,) + r[2:]

            # Partiyalar ataylab kichik: `keywords` qatori 5 KB gacha bo'lishi
            # mumkin, ya'ni 500 qatorlik INSERT bepul Supabase uchun 2.5 MB lik
            # bitta buyruq — aynan shunisi "statement timeout" bilan tushardi.
            changed = 0
            if prod_rows:
                written = psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO products (id,slug,name,title,category,rating,"
                    "reviews,image,images,in_stock,keywords,source,price,url,"
                    "updated_at) VALUES %s "
                    "ON CONFLICT (id) DO UPDATE SET "
                    + ", ".join(f"{c} = EXCLUDED.{c}" for c in _PRODUCT_COLS + ("updated_at",))
                    + " WHERE (" + ", ".join(f"products.{c}" for c in _PRODUCT_COLS)
                    + ") IS DISTINCT FROM ("
                    + ", ".join(f"EXCLUDED.{c}" for c in _PRODUCT_COLS) + ") "
                    "RETURNING 1",
                    prod_rows, page_size=200, fetch=True,
                )
                changed = len(written)
            print(f"[db] mahsulotlar: {len(prod_rows)} ta, shundan {changed} tasi "
                  f"yangi/o'zgargan, {removed} tasi o'chirildi", flush=True)

            if mkt_rows:
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO product_markets (product_id,source,price,url,created_at) "
                    "VALUES %s ON CONFLICT (product_id, source) DO UPDATE SET "
                    "price = EXCLUDED.price, url = EXCLUDED.url, "
                    "created_at = EXCLUDED.created_at",
                    [m + (now,) for m in mkt_rows], page_size=500,
                )
                print(f"[db] {len(mkt_rows)} ta narx yozuvi yangilandi, "
                      f"{stale} ta eskisi o'chirildi", flush=True)
    return len(prod_rows), len(mkt_rows)


def _dsn_problem(dsn: str) -> str | None:
    """DSN da psycopg2 tushunmaydigan ko'rinadigan xato bormi.

    Eng ko'p uchraydigani — parolda kodlanmagan `@`. libpq userinfo ni
    BIRINCHI `@` da ajratadi, shuning uchun parolning qolgan qismi host
    nomiga qo'shilib ketadi va xato `could not translate host name
    "...@aws-0-....pooler.supabase.com"` bo'lib chiqadi — parolga umuman
    ishora qilmaydi. Shuning uchun o'zimiz aytamiz.
    """
    netloc = urlsplit(dsn).netloc
    if netloc.count("@") > 1:
        return ("DSN da bittadan ko'p `@` bor — parolingizdagi maxsus "
                "belgilar kodlanmagan. URI da parolni percent-encoding "
                "bilan yozing: @ → %40, : → %3A, / → %2F, # → %23, "
                "? → %3F, & → %26, % → %25")
    if not urlsplit(dsn).hostname:
        return "DSN da host yo'q — connection string to'liq ko'chirilmaganga o'xshaydi"
    host = urlsplit(dsn).hostname or ""
    user = urlsplit(dsn).username or ""
    # Supabase pooler foydalanuvchi nomidan qaysi loyihaga ulanishni biladi:
    # u `postgres.<project-ref>` bo'lishi SHART. Oddiy `postgres` berilsa
    # pooler marshrutni topa olmaydi va buni "password authentication
    # failed" deb aytadi — ya'ni parolni qayta-qayta tekshirishga undaydi,
    # holbuki parol to'g'ri.
    if host.endswith(".pooler.supabase.com") and "." not in user:
        return (f"pooler uchun foydalanuvchi nomi `postgres.<project-ref>` "
                f"bo'lishi kerak, hozir `{user}`. Supabase → Connect dagi "
                f"satrni to'liq ko'chiring (parolgina almashtiriladi).")
    return None


def check_db_url() -> None:
    """CSV larni o'qishdan OLDIN DSN ni tekshiradi.

    Yig'ish 15 daqiqa, guruhlash yana yarim daqiqa ketadi; DSN yo'qligi esa
    shundan keyin, ulanish urinishlarida ma'lum bo'lardi. Bu yerda darhol
    to'xtaymiz va sababini aytamiz — CI dagi "socket topilmadi" xatosi
    o'rniga.
    """
    raw = os.getenv("PRODUCTS_DB_URL", "").strip()
    if raw:
        problem = _dsn_problem(raw)
        if problem is None:
            return
        _annotate("error", f"PRODUCTS_DB_URL noto'g'ri: {problem}")
        sys.exit(1)
    if os.getenv("GITHUB_ACTIONS") == "true":
        print("::error::PRODUCTS_DB_URL bo'sh — SUPABASE_DB_URL siri "
              "o'rnatilmagan yoki bo'sh qiymat bilan saqlangan. Settings → "
              "Secrets and variables → Actions da uni Supabase ning "
              "connection string i bilan qayta yozing.", flush=True)
        sys.exit(1)
    print(f"[db] PRODUCTS_DB_URL berilmadi — mahalliy bazaga ulanamiz "
          f"({LOCAL_DB_URL})", flush=True)


if __name__ == "__main__":
    check_db_url()
    # CI yig'ishdan OLDIN chaqiradi: ulanib bo'lmasa, 15 daqiqalik yig'ish
    # behuda ketmasin.
    if "--check-db" in sys.argv:
        connect().close()
        print("[db] ulanish OK", flush=True)
        sys.exit(0)
    print(f"Loading CSVs from {DATA_DIR} ...", flush=True)
    rows = load_rows()
    print(f"Loaded {len(rows)} valid rows", flush=True)
    groups = build_groups(rows)
    print(f"Built {len(groups)} product groups", flush=True)
    n_p, n_m = write_db(groups)
    print(f"DONE: {n_p} products, {n_m} market entries", flush=True)
