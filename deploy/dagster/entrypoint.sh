#!/bin/sh
# dagster va mlflow bazalari asosiy Postgres ichida. init.sql faqat birinchi
# ishga tushishda ishlaydi, server esa allaqachon bor — shuning uchun shu yerda.
set -e
python3 - <<'PY'
import os, time, psycopg2
for _ in range(60):
    try:
        conn = psycopg2.connect(host="postgres", user="postgres", dbname="fullbazar",
                                password=os.environ["POSTGRES_PASSWORD"])
        break
    except psycopg2.OperationalError:
        time.sleep(2)
else:
    raise SystemExit("postgres ga ulanib bo'lmadi")
conn.autocommit = True
cur = conn.cursor()
for db in ("dagster", "mlflow"):
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db,))
    if not cur.fetchone():
        cur.execute(f'CREATE DATABASE "{db}"')
        print(f"[init] {db} bazasi yaratildi", flush=True)
PY
exec "$@"
