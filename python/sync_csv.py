"""Standalone CSV → PostgreSQL sync. No dagster dependency."""
from __future__ import annotations
import csv, hashlib, math, os, re, sys
from collections import Counter
from datetime import datetime

import psycopg2, psycopg2.extras

DATA_DIR = os.getenv("DATA_DIR", "/opt/dagster/data")
DB_URL = os.getenv("PRODUCTS_DB_URL", "postgresql://postgres:postgres@postgres:5432/fullbazar")

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
_INACTIVE_SITES = {"ozon", "premier", "wildberries", "prom"}
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


def _cosim(a, b):
    v1, v2 = Counter(re.findall(r"\w+", a)), Counter(re.findall(r"\w+", b))
    inter = set(v1) & set(v2)
    num = sum(v1[x] * v2[x] for x in inter)
    den = math.sqrt(sum(v**2 for v in v1.values())) * math.sqrt(sum(v**2 for v in v2.values()))
    return num / den if den else 0.0


def load_rows():
    rows = []
    for fn in sorted(os.listdir(DATA_DIR)):
        if not fn.endswith(".csv"):
            continue
        src_fallback = fn.replace("_products.csv", "").replace("-", "_").split("_")[0]
        # Faoliyati to'xtagan saytlarni o'tkazib yuboramiz
        if src_fallback.lower() in _INACTIVE_SITES:
            print(f"[sync] Skipping inactive site: {fn}", flush=True)
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


def write_db(groups):
    prod_rows, mkt_rows = [], []
    for pid, g in groups.items():
        sm = sorted(g["markets"].values(), key=lambda m: m["price"])
        best = sm[0] if sm else {}
        prod_rows.append((
            pid, g["name"], g["title"], "Phones",
            g["rating"], g["reviews"], g["image"] or None,
            g["images"] or None, True, g["keywords"][:5000],
            best.get("source"), best.get("price", 0), best.get("url"),
            datetime.utcnow(),
        ))
        for m in sm:
            mkt_rows.append((pid, m["source"], m["price"], m["url"]))

    conn = psycopg2.connect(DB_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                # ── Narx tarixi ─────────────────────────────────────────────
                # product_markets TRUNCATE qilinishidan OLDIN joriy narxlarni
                # saqlab qolamiz. Ilgari buni faqat serverdagi dagster qilardi,
                # ya'ni serverning o'z postgres'iga — jonli baza esa Supabase.
                # Shu sababli production'da price_history bo'sh turgan va
                # "narxi tushdi/oshdi" hamda narx grafigi hech qachon
                # ishlamagan.
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
                # Faqat narxi O'ZGARGANLARINI yozamiz. Har safar hammasini
                # yozsak, kuniga ~22 ming qator qo'shilib, Supabase'ning bepul
                # 500 MB chegarasi bir necha oyda to'lib qolardi.
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
                if prod_rows:
                    psycopg2.extras.execute_values(
                        cur,
                        "INSERT INTO products (id,name,title,category,rating,reviews,image,images,in_stock,keywords,source,price,url,updated_at) VALUES %s",
                        prod_rows, page_size=500,
                    )
                if mkt_rows:
                    psycopg2.extras.execute_values(
                        cur,
                        "INSERT INTO product_markets (product_id,source,price,url) VALUES %s",
                        mkt_rows, page_size=1000,
                    )
        return len(prod_rows), len(mkt_rows)
    finally:
        conn.close()


if __name__ == "__main__":
    print(f"Loading CSVs from {DATA_DIR} ...", flush=True)
    rows = load_rows()
    print(f"Loaded {len(rows)} valid rows", flush=True)
    groups = build_groups(rows)
    print(f"Built {len(groups)} product groups", flush=True)
    n_p, n_m = write_db(groups)
    print(f"DONE: {n_p} products, {n_m} market entries", flush=True)
