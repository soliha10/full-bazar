"""Yiqilgan scraper himoyasi: e'lonlari keskin kamaygan do'kon narxlari o'chirilmaydi."""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

import psycopg2.extras

from .common import _annotate
from .load import STALE_SOURCES


# Scraper yiqilib, do'kon odatdagidan ancha kam mahsulot bersa (masalan alif
# sahifasi timeout bo'ldi), o'sha do'konning bazadagi narxlari o'chirilmaydi —
# aks holda yuzlab mahsulot o'chib, keyingi ishda qayta yozilardi (2026-10-23:
# 3131 → 2314 → 3131). Saqlangan narxlar PROTECT_MAX_AGE dan eskirsa baribir
# o'chadi, ya'ni butunlay buzilgan scraper eski narxni abadiy ko'rsatmaydi.
DROP_RATIO = 0.5
DROP_MIN_ROWS = 20
PROTECT_MAX_AGE = "2 days"


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
