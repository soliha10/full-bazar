"""CSV → PostgreSQL sinxronizatsiyasi. GitHub Actions ishga tushiradi.

Kodning o'zi python/sync/ paketida (o'qish, guruhlash, sluglar, ulanish,
himoya, aliaslar, yozish). Bu fayl — kirish nuqtasi: Dagster va deploy
skriptlari `python python/sync_csv.py` ni chaqiradi, shuning uchun nomi va
ochiq funksiyalari (load_rows, build_groups, write_db, ...) shu yerda qoladi.
"""
from __future__ import annotations

import sys

from sync.aliases import _migrate_ids  # noqa: F401
from sync.common import _annotate, _dsn_problem  # noqa: F401
from sync.conn import (  # noqa: F401
    CONNECT_ATTEMPTS, CONNECT_BACKOFF, DB_URL, IDLE_TX_TIMEOUT_MS, LOCAL_DB_URL,
    LOCK_TIMEOUT_MS, STATEMENT_TIMEOUT_MS, _apply_timeouts, _TIMEOUTS,
    check_db_url, connect,
)
from sync.groups import _display, _norm, build_groups  # noqa: F401
from sync.guard import (  # noqa: F401
    DROP_MIN_ROWS, DROP_RATIO, PROTECT_MAX_AGE, _protected_sources,
)
from sync.load import (  # noqa: F401
    _INACTIVE_SITES, _NOT_SMARTPHONE_RE, _SMARTPHONE_RE, DATA_DIR,
    MAX_CSV_AGE_DAYS, STALE_SOURCES, _too_old, fake_reason, load_rows,
)
from sync.slugs import SLUG_DDL, _slugify, assign_slugs, load_existing_slugs  # noqa: F401
from sync.write import (  # noqa: F401
    _PRODUCT_COLS, WRITE_ATTEMPTS, WRITE_BACKOFF, _write_rows, write_db,
)


if __name__ == "__main__":
    check_db_url()
    # CI yig'ishdan OLDIN chaqiradi: ulanib bo'lmasa, 15 daqiqalik yig'ish
    # behuda ketmasin.
    if "--check-db" in sys.argv:
        connect().close()
        print("[db] ulanish OK", flush=True)
        sys.exit(0)
    print(f"Loading CSVs from {DATA_DIR} ...", flush=True)
    rows = load_rows()
    print(f"Loaded {len(rows)} valid rows", flush=True)
    groups = build_groups(rows)
    print(f"Built {len(groups)} product groups", flush=True)
    n_p, n_m = write_db(groups)
    print(f"DONE: {n_p} products, {n_m} market entries", flush=True)
