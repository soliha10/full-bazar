"""Guruhlarni bazaga yozish: narx tarixi, aliaslar, products/product_markets UPSERT."""
from __future__ import annotations

import time
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras

from .aliases import _migrate_ids
from .conn import _apply_timeouts, connect
from .guard import PROTECT_MAX_AGE, _protected_sources
from .slugs import assign_slugs, load_existing_slugs


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
                 "url", "variants")


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
            psycopg2.extras.Json(g.get("variants") or []),
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
                    "variants,updated_at) VALUES %s "
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
