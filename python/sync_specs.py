"""
data/gsmarena_specs.csv → PostgreSQL product_specs.

Mahsulot narxlarini yuklaydigan sync_csv.py dan alohida: xususiyatlar tez-tez
o'zgarmaydi, shuning uchun bu skript haftada bir marta ishlatiladi va
`products` jadvaliga umuman tegmaydi.

Yozuvlar `source = 'gsmarena'` belgisi bilan saqlanadi. FastAPI ishga
tushganda specs_seed.py dagi qo'lda yozilgan yozuvlarni jadvalga qo'yadi,
lekin faqat `source = 'seed'` bo'lganlarini yangilaydi — shuning uchun bu
yerda yozilgan aniqroq ma'lumot API qayta ishga tushganda o'chib ketmaydi.

Ikki rejim:
    python python/sync_specs.py --export   bazadagi gsmarena yozuvlarini CSV ga
                                           chiqaradi (scraper undan boshlaydi)
    python python/sync_specs.py            CSV ni bazaga yozadi + qamrov hisoboti

--export scraperdan OLDIN chaqiriladi: shu tufayli o'tgan haftalarda yig'ilgan
model sahifalari qaytadan yuklanmaydi va tafsilot qamrovi ish sayin ortadi.
"""
from __future__ import annotations

import csv
import json
import os
import sys

import psycopg2
import psycopg2.extras

# Brend jadvali API bilan bitta manbadan — takrorlanmasin.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "fastapi_app"))
import brands as brand_table  # noqa: E402

DATA_DIR = os.getenv("DATA_DIR", "./data")
DB_URL = os.getenv("PRODUCTS_DB_URL", "postgresql://postgres:postgres@postgres:5432/fullbazar")
CSV_PATH = os.path.join(DATA_DIR, "gsmarena_specs.csv")

# API ham shu jadvalni yaratadi; bu skript undan oldin ishlashi mumkin,
# shuning uchun sxema shu yerda ham ta'minlanadi.
DDL = """
CREATE TABLE IF NOT EXISTS product_specs (
    id              SERIAL PRIMARY KEY,
    brand           VARCHAR(50)  NOT NULL,
    model_key       VARCHAR(100) NOT NULL,
    display_name    VARCHAR(150) NOT NULL,
    display         VARCHAR(200),
    chipset         VARCHAR(150),
    ram_options     TEXT[]       NOT NULL DEFAULT '{}',
    storage_options TEXT[]       NOT NULL DEFAULT '{}',
    main_camera     VARCHAR(200),
    selfie_camera   VARCHAR(150),
    battery_mah     INTEGER,
    charging        VARCHAR(100),
    os              VARCHAR(100),
    body            VARCHAR(200),
    release_year    SMALLINT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_specs_model
    ON product_specs(brand, model_key);
ALTER TABLE product_specs
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'seed';
ALTER TABLE product_specs
    ADD COLUMN IF NOT EXISTS source_url TEXT;
"""

UPSERT = """
INSERT INTO product_specs
    (brand, model_key, display_name, display, chipset, ram_options,
     storage_options, main_camera, selfie_camera, battery_mah,
     charging, os, body, release_year, source, source_url)
VALUES %s
ON CONFLICT (brand, model_key) DO UPDATE SET
    display_name    = EXCLUDED.display_name,
    display         = EXCLUDED.display,
    chipset         = EXCLUDED.chipset,
    ram_options     = EXCLUDED.ram_options,
    storage_options = EXCLUDED.storage_options,
    main_camera     = EXCLUDED.main_camera,
    selfie_camera   = EXCLUDED.selfie_camera,
    battery_mah     = EXCLUDED.battery_mah,
    charging        = EXCLUDED.charging,
    os              = EXCLUDED.os,
    body            = EXCLUDED.body,
    release_year    = EXCLUDED.release_year,
    source          = EXCLUDED.source,
    source_url      = EXCLUDED.source_url
"""


def _int_or_none(value: str) -> int | None:
    value = (value or "").strip()
    return int(value) if value.isdigit() else None


def _json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return [str(x) for x in parsed] if isinstance(parsed, list) else []
    except (ValueError, TypeError):
        return []


def load_rows() -> list[tuple]:
    if not os.path.exists(CSV_PATH):
        print(f"[specs] {CSV_PATH} topilmadi — o'tkazib yuborildi", flush=True)
        return []

    rows: list[tuple] = []
    seen: set[tuple[str, str]] = set()
    with open(CSV_PATH, newline="", encoding="utf-8") as fh:
        for r in csv.DictReader(fh):
            brand = (r.get("brand") or "").strip().lower()
            model_key = (r.get("model_key") or "").strip().lower()
            display_name = (r.get("display_name") or "").strip()
            if not brand or not model_key or not display_name:
                continue
            # Jadvalda (brand, model_key) unique — bitta INSERT ichida takror
            # kelsa "ON CONFLICT ... cannot affect row a second time" xatosi chiqadi
            key = (brand, model_key)
            if key in seen:
                continue
            seen.add(key)

            rows.append((
                brand,
                model_key[:100],
                display_name[:150],
                (r.get("display") or "")[:200] or None,
                (r.get("chipset") or "")[:150] or None,
                _json_list(r.get("ram_options", "")),
                _json_list(r.get("storage_options", "")),
                (r.get("main_camera") or "")[:200] or None,
                (r.get("selfie_camera") or "")[:150] or None,
                _int_or_none(r.get("battery_mah", "")),
                (r.get("charging") or "")[:100] or None,
                (r.get("os") or "")[:100] or None,
                (r.get("body") or "")[:200] or None,
                _int_or_none(r.get("release_year", "")),
                "gsmarena",
                (r.get("source_url") or "") or None,
            ))
    return rows


def write_db(rows: list[tuple]) -> int:
    conn = psycopg2.connect(DB_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(DDL)
                if rows:
                    psycopg2.extras.execute_values(cur, UPSERT, rows, page_size=200)
        return len(rows)
    finally:
        conn.close()




def coverage_report() -> None:
    """
    Nechta mahsulot xususiyatlarga ega bo'ldi — API dagi bilan AYNAN bir xil
    mantiq (brands.match_spec_row). "Yana manba kerakmi?" degan savolni
    o'lchovli qiladi.
    """
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT brand, model_key FROM product_specs")
            spec_index = brand_table.build_spec_index(
                [{"brand": b, "model_key": k} for b, k in cur.fetchall()]
            )
            cur.execute("SELECT name, keywords FROM products")
            products = cur.fetchall()
    finally:
        conn.close()

    if not products:
        print("[qamrov] products jadvali bo'sh", flush=True)
        return

    matched = 0
    unmatched_brands: dict[str, int] = {}
    for name, keywords in products:
        if brand_table.match_spec_row(name or "", keywords or "", spec_index):
            matched += 1
        else:
            brand = brand_table.extract_brand(f"{name or ''} {keywords or ''}")
            key = brand or "(brend aniqlanmadi)"
            unmatched_brands[key] = unmatched_brands.get(key, 0) + 1

    pct = matched * 100 // len(products)
    print(f"[qamrov] {matched}/{len(products)} mahsulot ({pct}%) xususiyatlarga ega",
          flush=True)
    if unmatched_brands:
        top = sorted(unmatched_brands.items(), key=lambda kv: -kv[1])[:8]
        print("[qamrov] eng ko'p yetishmayotgan brendlar: "
              + ", ".join(f"{b}={n}" for b, n in top), flush=True)


EXPORT_COLUMNS = [
    "brand", "model_key", "display_name", "display", "chipset", "ram_options",
    "storage_options", "main_camera", "selfie_camera", "battery_mah",
    "charging", "os", "body", "release_year", "source_url",
]


def export_csv() -> int:
    """
    Bazadagi gsmarena yozuvlarini CSV ga qaytaradi.

    Scraper shu fayldan boshlaydi va `source_url` bo'yicha allaqachon o'qilgan
    model sahifalarini qayta yuklamaydi — ya'ni tafsilot qamrovi har haftada
    o'sib boradi, nolga qaytmaydi.
    """
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(DDL)
            cur.execute(
                "SELECT brand, model_key, display_name, display, chipset,"
                "       ram_options, storage_options, main_camera, selfie_camera,"
                "       battery_mah, charging, os, body, release_year, source_url"
                "  FROM product_specs WHERE source = 'gsmarena' AND source_url IS NOT NULL"
            )
            rows = cur.fetchall()
        conn.commit()
    finally:
        conn.close()

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for r in rows:
            record = dict(zip(EXPORT_COLUMNS, r))
            record["ram_options"] = json.dumps(list(record["ram_options"] or []))
            record["storage_options"] = json.dumps(list(record["storage_options"] or []))
            record["battery_mah"] = record["battery_mah"] or ""
            record["release_year"] = record["release_year"] or ""
            writer.writerow({k: (v if v is not None else "") for k, v in record.items()})
    print(f"[eksport] {len(rows)} ta yozuv {CSV_PATH} ga chiqarildi", flush=True)
    return len(rows)


if __name__ == "__main__":
    if "--export" in sys.argv:
        try:
            export_csv()
        except Exception as exc:
            # Eksport ixtiyoriy tezlashtirish — u yiqilsa scraper noldan
            # boshlaydi, ish baribir davom etishi kerak.
            print(f"[eksport] bajarilmadi: {exc}", flush=True)
        sys.exit(0)

    specs = load_rows()
    print(f"[specs] CSV dan {len(specs)} ta yozuv o'qildi", flush=True)
    if not specs:
        print("[specs] yozadigan narsa yo'q", flush=True)
        sys.exit(0)
    written = write_db(specs)
    print(f"[specs] DONE: {written} ta model product_specs ga yozildi", flush=True)
    try:
        coverage_report()
    except Exception as exc:  # hisobot yiqilsa ham sync muvaffaqiyatli hisoblanadi
        print(f"[qamrov] hisobot tuzilmadi: {exc}", flush=True)
