"""CSV → PostgreSQL sinxronizatsiyasi. GitHub Actions ishga tushiradi."""
from __future__ import annotations
import csv, hashlib, math, os, re, sys, time, unicodedata
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import urlsplit

import psycopg2, psycopg2.extras

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
_DIFF_WORDS = re.compile(r"\b(max|plus|ultra|pro|lite|mini|fe|note|edge|fold|\d+gb|\d+tb|\d+\/\d+)\b")

# ── Variantni ajratish ────────────────────────────────────────────────────────
# _DIFF_WORDS dagi xotira naqshlari amalda hech qachon ishlamaydi: _norm "/" ni
# bo'sh joyga aylantiradi ("8/256 GB" -> "8 256 gb"), shuning uchun `\d+\/\d+`
# mos kelmaydi, do'konlar esa "256 GB" deb bo'sh joy bilan yozadi, ya'ni `\d+gb`
# ham mos kelmaydi. Natijada 128GB va 256GB variantlari bitta mahsulotga
# qo'shilib ketardi va narx solishtirish noto'g'ri bo'lardi.
# Birlik ixtiyoriy: ko'p do'kon "8/128 Midnight Black" deb GB siz yozadi.
_PAIR_RE  = re.compile(r"\b(\d{1,2})\s+(\d{2,4})\s*(gb|tb|гб|тб)?\b")  # "8 256 gb" / "8 128"
_SOLO_RE  = re.compile(r"\b(\d{2,4})\s*(gb|tb|гб|тб)\b")               # "256 gb"
_KNOWN_STORAGE = {32, 64, 128, 256, 512, 1024, 2048}
# "iphone 15 128 gb" da birinchi son model raqami, RAM emas. Shuning uchun
# faqat haqiqatda uchraydigan RAM hajmlarini qabul qilamiz.
_PLAUSIBLE_RAM = {2, 3, 4, 6, 8, 12, 16, 18, 24}
# Ham harf, ham raqamdan iborat token — telefon modelining nomi:
# "s25", "s25+", "x8c", "a36". Shu bilan S25 va S25+, X8c va X7c ajraladi.
_MODEL_TOKEN_RE = re.compile(r"\b(?=\w*\d)(?=\w*[a-z])\w+\+?")


def _variant_parts(n: str):
    """Normallashtirilgan sarlavhadan (xotira_gb, ram_gb, belgilar) ni ajratadi."""
    ram = storage = None
    for m in _PAIR_RE.finditer(n):
        unit = m.group(3)
        cand = int(m.group(2)) * (1024 if unit in ("tb", "тб") else 1)
        # Birlik yozilmagan bo'lsa, son haqiqiy xotira hajmi bo'lishi shart —
        # aks holda "galaxy a17 6 128" dagi tasodifiy juftliklar ham tushardi.
        if unit is None and cand not in _KNOWN_STORAGE:
            continue
        storage = cand
        first = int(m.group(1))
        ram = first if first in _PLAUSIBLE_RAM else None
        break
    if storage is None:
        for num, unit in _SOLO_RE.findall(n):
            v = int(num) * (1024 if unit in ("tb", "тб") else 1)
            if v in _KNOWN_STORAGE:
                storage = v
                break
    marks = frozenset(_DIFF_WORDS.findall(n)) | frozenset(_MODEL_TOKEN_RE.findall(n))
    return storage, ram, marks


def _same_variant(a: str, b: str) -> bool:
    """Ikki sarlavha bitta variantni bildiradimi?

    Ataylab ehtiyotkor: xotira yoki RAM faqat IKKALASIDA ham ko'rsatilgan va
    farq qilgandagina ajratamiz. Bir do'kon hajmni umuman yozmagan bo'lsa,
    uni alohida mahsulotga ajratib yuborish takliflarni yo'qotardi.
    """
    sa, ra, ma = _variant_parts(a)
    sb, rb, mb = _variant_parts(b)
    if ma != mb:
        return False
    if sa is not None and sb is not None and sa != sb:
        return False
    if ra is not None and rb is not None and ra != rb:
        return False
    return True


BRANDS = ["apple","samsung","redmi","xiaomi","oppo","vivo","realme","honor","huawei","tecno","infinix","itel","poco"]


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
        base = _slugify(g["title"]) or _slugify(g["name"]) or pid
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


def _cosim(a, b):
    v1, v2 = Counter(re.findall(r"\w+", a)), Counter(re.findall(r"\w+", b))
    inter = set(v1) & set(v2)
    num = sum(v1[x] * v2[x] for x in inter)
    den = math.sqrt(sum(v**2 for v in v1.values())) * math.sqrt(sum(v**2 for v in v2.values()))
    return num / den if den else 0.0


def load_rows():
    rows = []
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
    return rows


def build_groups(rows):
    groups, brand_g, norm_pid = {}, {}, {}
    for row in rows:
        n = _norm(row["title"])
        brand = next((b for b in BRANDS if b in n), "other")
        pid = norm_pid.get(n)
        if not pid:
            for p in brand_g.get(brand, []):
                if (_cosim(n, _norm(groups[p]["title"])) >= 0.85 and
                        _same_variant(n, _norm(groups[p]["title"]))):
                    pid = p
                    norm_pid[n] = p
                    break
        if not pid:
            pid = "prod-" + hashlib.md5(n.encode()).hexdigest()[:20]
            norm_pid[n] = pid
            brand_g.setdefault(brand, []).append(pid)
            rating = None
            if row["rating"]:
                try:
                    r = float(row["rating"])
                    if 1 <= r <= 5:
                        rating = round(r, 2)
                except (ValueError, TypeError):
                    pass
            reviews = None
            if row["reviews"]:
                try:
                    reviews = int(row["reviews"])
                except (ValueError, TypeError):
                    pass
            groups[pid] = {
                "id": pid, "name": _display(row["title"]), "title": row["title"],
                "rating": rating, "reviews": reviews,
                "image": row["image"], "images": [row["image"]] if row["image"] else [],
                "keywords": row["title"].lower(), "markets": {},
            }
        g = groups[pid]
        if len(row["title"]) > len(g["title"]):
            g["title"] = row["title"]
        g["keywords"] += " " + row["title"].lower()
        if row["image"] and row["image"] not in g["images"]:
            g["images"].append(row["image"])
        if row["image"] and not g["image"]:
            g["image"] = row["image"]
        src, price = row["src"], row["price"]
        if src not in g["markets"] or price < g["markets"][src]["price"]:
            g["markets"][src] = {"source": src.capitalize(), "price": price, "url": row["url"]}
    return groups


SLUG_DDL = (
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(200)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)",
)


def load_existing_slugs(conn) -> dict:
    """{product_id: slug} — oldingi sinxronizatsiyada berilgan manzillar."""
    with conn.cursor() as cur:
        _apply_timeouts(cur)
        for stmt in SLUG_DDL:
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
# TRUNCATE ga ACCESS EXCLUSIVE qulf kerak, uni esa saytning o'qish so'rovlari
# ushlab turishi mumkin. Kutishning cheki bo'lmasa, butun byudjet shunga ketadi.
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
        # Sluglarni TRUNCATE dan oldin o'qiymiz: mahsulotning manzili bir marta
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


def _write_rows(conn, groups):
    prod_rows, mkt_rows = [], []
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
            datetime.now(timezone.utc),
        ))
        for m in sm:
            mkt_rows.append((pid, m["source"], m["price"], m["url"]))

    with conn:
        with conn.cursor() as cur:
            _apply_timeouts(cur)
            # ── Narx tarixi ─────────────────────────────────────────────────
            # product_markets TRUNCATE qilinishidan OLDIN joriy narxlarni
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

            cur.execute("TRUNCATE product_markets, products")
            # Partiyalar ataylab kichik: `keywords` qatori 5 KB gacha bo'lishi
            # mumkin, ya'ni 500 qatorlik INSERT bepul Supabase uchun 2.5 MB lik
            # bitta buyruq — aynan shunisi "statement timeout" bilan tushardi.
            if prod_rows:
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO products (id,slug,name,title,category,rating,"
                    "reviews,image,images,in_stock,keywords,source,price,url,"
                    "updated_at) VALUES %s",
                    prod_rows, page_size=200,
                )
                print(f"[db] {len(prod_rows)} ta mahsulot yozildi", flush=True)
            if mkt_rows:
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO product_markets (product_id,source,price,url) VALUES %s",
                    mkt_rows, page_size=500,
                )
                print(f"[db] {len(mkt_rows)} ta narx yozuvi yozildi", flush=True)
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
    print(f"Loading CSVs from {DATA_DIR} ...", flush=True)
    rows = load_rows()
    print(f"Loaded {len(rows)} valid rows", flush=True)
    groups = build_groups(rows)
    print(f"Built {len(groups)} product groups", flush=True)
    n_p, n_m = write_db(groups)
    print(f"DONE: {n_p} products, {n_m} market entries", flush=True)
