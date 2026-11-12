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

# Umumiy yordamchilar va jadval sxemasi python/sync/ paketida (sync_csv.py
# bilan bitta manba). Qamrov hisoboti va eksport — sync/specs_report.py.
from sync import specs_report
from sync.common import _annotate, _dsn_problem
from sync.specs_sql import DDL, UPSERT

DATA_DIR = os.getenv("DATA_DIR", "./data")

# Zaxira — docker compose dagi mahalliy baza. Bo'sh muhit o'zgaruvchisi
# BERILMAGAN deb qaraladi; sababi sync/conn.py dagi izohda.
LOCAL_DB_URL = "postgresql://postgres:postgres@postgres:5432/fullbazar"
DB_URL = os.getenv("PRODUCTS_DB_URL", "").strip() or LOCAL_DB_URL
CSV_PATH = os.path.join(DATA_DIR, "gsmarena_specs.csv")


def check_db_url() -> None:
    """DSN bo'sh bo'lsa darhol to'xtaydi (sync_csv.check_db_url bilan bir xil)."""
    raw = os.getenv("PRODUCTS_DB_URL", "").strip()
    if raw:
        problem = _dsn_problem(raw)
        if problem is None:
            return
        _annotate("error", f"PRODUCTS_DB_URL noto'g'ri: {problem}")
        sys.exit(1)
    if os.getenv("GITHUB_ACTIONS") == "true":
        _annotate("error", "PRODUCTS_DB_URL bo'sh — SUPABASE_DB_URL siri "
                           "o'rnatilmagan yoki bo'sh qiymat bilan saqlangan.")
        sys.exit(1)
    print(f"[db] PRODUCTS_DB_URL berilmadi — mahalliy baza ({LOCAL_DB_URL})",
          flush=True)


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
        # Ilgari bu oddiy `print` edi va ish 11 soniyada YASHIL tugardi:
        # xususiyatlar oylab yozilmayotgani Actions sahifasidan bilinmasdi.
        _annotate("warning", f"{CSV_PATH} topilmadi — xususiyatlar "
                             f"yangilanmadi. GSMArena ni mahalliy yig'ib "
                             f"(python/scrape_specs_local.py) natijani "
                             f"repoga commit qilish kerak.")
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
                # Supabase sukuti 7000 qatorlik UPSERT ga yetmaydi
                # ("canceling statement due to statement timeout"). 6543-port
                # TRANSACTION rejimida ulanishdagi SET saqlanmaydi, shuning
                # uchun SET LOCAL — sync/conn.py dagi _apply_timeouts dagidek.
                cur.execute("SET LOCAL statement_timeout = 600000")
                cur.execute("SET LOCAL lock_timeout = 60000")
                cur.execute(DDL)
                if rows:
                    psycopg2.extras.execute_values(cur, UPSERT, rows, page_size=200)
        return len(rows)
    finally:
        conn.close()


def coverage_report() -> None:
    """Qamrov hisoboti (mantiq sync/specs_report.py da)."""
    specs_report.coverage_report(DB_URL)


def export_csv() -> int:
    """Bazadagi gsmarena yozuvlarini CSV ga qaytaradi (sync/specs_report.py)."""
    return specs_report.export_csv(DB_URL, DATA_DIR, CSV_PATH)


if __name__ == "__main__":
    check_db_url()
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
