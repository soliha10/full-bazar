"""
data/gsmarena_specs.csv → PostgreSQL product_specs.

Mahsulot narxlarini yuklaydigan sync_csv.py dan alohida: xususiyatlar tez-tez
o'zgarmaydi, shuning uchun bu skript haftada bir marta ishlatiladi va
`products` jadvaliga umuman tegmaydi.

Yozuvlar `source = 'gsmarena'` belgisi bilan saqlanadi. FastAPI ishga
tushganda specs_seed.py dagi qo'lda yozilgan yozuvlarni jadvalga qo'yadi,
lekin faqat `source = 'seed'` bo'lganlarini yangilaydi — shuning uchun bu
yerda yozilgan aniqroq ma'lumot API qayta ishga tushganda o'chib ketmaydi.
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys

import psycopg2
import psycopg2.extras

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


_NORM_RE = re.compile(r"[^a-z0-9\s]")

# main.py dagi _BRAND_KWS bilan bir xil (tartib ham muhim)
_BRAND_KWS = {
    "apple": ["apple", "iphone"], "samsung": ["samsung", "galaxy"],
    "redmi": ["redmi"], "poco": ["poco"], "xiaomi": ["xiaomi"],
    "honor": ["honor"], "vivo": ["vivo"], "oppo": ["oppo"],
    "realme": ["realme"], "tecno": ["tecno", "camon", "spark"],
    "infinix": ["infinix"], "zte": ["zte", "nubia"],
}


def _normalize(text: str) -> str:
    return " ".join(_NORM_RE.sub(" ", (text or "").lower()).split())


def _brand_of(text: str) -> str:
    text = (text or "").lower()
    for canonical, kws in _BRAND_KWS.items():
        if any(kw in text for kw in kws):
            return canonical
    return ""


def coverage_report() -> None:
    """
    Nechta mahsulot xususiyatlarga ega bo'ldi — main.py dagi _match_spec_row
    bilan bir xil mantiq. "Yana manba kerakmi?" degan savolni o'lchovli qiladi.
    """
    conn = psycopg2.connect(DB_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT brand, model_key FROM product_specs")
            specs: dict[str, list[str]] = {}
            for brand, key in cur.fetchall():
                specs.setdefault(brand, []).append(key)
            for keys in specs.values():
                keys.sort(key=len, reverse=True)

            cur.execute("SELECT name, keywords FROM products")
            products = cur.fetchall()
    finally:
        conn.close()

    if not products:
        return

    matched = 0
    unmatched_brands: dict[str, int] = {}
    for name, keywords in products:
        blob = f"{name or ''} {keywords or ''}"
        brand = _brand_of(blob)
        norm = _normalize(blob)
        if brand and any(k in norm for k in specs.get(brand, [])):
            matched += 1
        else:
            unmatched_brands[brand or "(brend aniqlanmadi)"] = \
                unmatched_brands.get(brand or "(brend aniqlanmadi)", 0) + 1

    pct = matched * 100 // len(products)
    print(f"[qamrov] {matched}/{len(products)} mahsulot ({pct}%) xususiyatlarga ega",
          flush=True)
    if unmatched_brands:
        top = sorted(unmatched_brands.items(), key=lambda kv: -kv[1])[:6]
        print("[qamrov] eng ko'p yetishmayotgan brendlar: "
              + ", ".join(f"{b}={n}" for b, n in top), flush=True)


if __name__ == "__main__":
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
