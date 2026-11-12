"""Bazaga ulanish: DSN tekshiruvi, qayta urinishlar va vaqt chegaralari."""
from __future__ import annotations

import os
import sys
import time

import psycopg2

from .common import _annotate, _dsn_problem


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
