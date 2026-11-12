"""
product_specs bo'yicha qamrov hisoboti va bazadan CSV ga eksport
(python/sync_specs.py chaqiradi; DSN va yo'llar argument sifatida beriladi).
"""
from __future__ import annotations

import csv
import json
import os
import sys

import psycopg2

from .specs_sql import DDL

# Brend jadvali API bilan bitta manbadan — takrorlanmasin.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fastapi_app"))
import brands as brand_table  # noqa: E402


def coverage_report(db_url: str) -> None:
    """
    Nechta mahsulot xususiyatlarga ega bo'ldi — API dagi bilan AYNAN bir xil
    mantiq (brands.match_spec_row). "Yana manba kerakmi?" degan savolni
    o'lchovli qiladi.
    """
    conn = psycopg2.connect(db_url)
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


def export_csv(db_url: str, data_dir: str, csv_path: str) -> int:
    """
    Bazadagi gsmarena yozuvlarini CSV ga qaytaradi.

    Scraper shu fayldan boshlaydi va `source_url` bo'yicha allaqachon o'qilgan
    model sahifalarini qayta yuklamaydi — ya'ni tafsilot qamrovi har haftada
    o'sib boradi, nolga qaytmaydi.
    """
    conn = psycopg2.connect(db_url)
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

    os.makedirs(data_dir, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for r in rows:
            record = dict(zip(EXPORT_COLUMNS, r))
            record["ram_options"] = json.dumps(list(record["ram_options"] or []))
            record["storage_options"] = json.dumps(list(record["storage_options"] or []))
            record["battery_mah"] = record["battery_mah"] or ""
            record["release_year"] = record["release_year"] or ""
            writer.writerow({k: (v if v is not None else "") for k, v in record.items()})
    print(f"[eksport] {len(rows)} ta yozuv {csv_path} ga chiqarildi", flush=True)
    return len(rows)
