"""Sinxronizatsiya skriptlari (sync_csv.py, sync_specs.py) uchun umumiy yordamchilar."""
from __future__ import annotations

import os
from urllib.parse import urlsplit


def _annotate(level: str, message: str) -> None:
    """GitHub Actions ogohlantirishi (mahalliy ishda oddiy satr)."""
    if os.getenv("GITHUB_ACTIONS") == "true":
        print(f"::{level}::{message}", flush=True)
    else:
        print(f"[{level}] {message}", flush=True)


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
