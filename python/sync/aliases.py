"""Eski mahsulot ID -> yangi ID (aliaslar) va bog'liq jadvallarni ko'chirish."""
from __future__ import annotations

from collections import Counter

import psycopg2.extras


def _migrate_ids(cur, groups) -> None:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS product_aliases (
            old_id     VARCHAR(60)  PRIMARY KEY,
            new_id     VARCHAR(60)  NOT NULL,
            old_slug   VARCHAR(200),
            created_at TIMESTAMPTZ  DEFAULT NOW()
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_product_aliases_slug ON product_aliases(old_slug)")

    cur.execute("SELECT product_id, lower(source), url FROM product_markets")
    owner = {(src, url): pid for pid, src, url in cur.fetchall()}
    votes: dict[str, Counter] = {}
    for pid, g in groups.items():
        for member in g.get("members", ()):
            old = owner.get(member)
            if old and old != pid:
                votes.setdefault(old, Counter())[pid] += 1
    new_ids = set(groups)
    # Eski mahsulot e'lonlarining ko'pi qaysi yangisiga o'tgan bo'lsa — o'sha
    pairs = {old: c.most_common(1)[0][0] for old, c in votes.items() if old not in new_ids}

    # Avval tirik mahsulot bo'lib qaytgan ID lar alias bo'lib qolmasin
    cur.execute("DELETE FROM product_aliases WHERE old_id = ANY(%s)", (list(new_ids),))
    if not pairs:
        return
    olds, news = list(pairs), [pairs[o] for o in pairs]
    cur.execute("SELECT id, slug FROM products WHERE id = ANY(%s)", (olds,))
    slugs = dict(cur.fetchall())

    cur.execute("CREATE TEMP TABLE _alias_map (old VARCHAR(60) PRIMARY KEY, new VARCHAR(60) NOT NULL) ON COMMIT DROP")
    psycopg2.extras.execute_values(cur, "INSERT INTO _alias_map (old, new) VALUES %s", list(zip(olds, news)))
    psycopg2.extras.execute_values(
        cur,
        "INSERT INTO product_aliases (old_id, new_id, old_slug) VALUES %s "
        "ON CONFLICT (old_id) DO UPDATE SET new_id = EXCLUDED.new_id, "
        "old_slug = COALESCE(EXCLUDED.old_slug, product_aliases.old_slug)",
        [(o, n, slugs.get(o)) for o, n in zip(olds, news)],
    )
    # Zanjir: oldingi sinxronizatsiyadagi aliaslar endi alias bo'lgan ID ga
    # ko'rsatayotgan bo'lsa — to'g'ridan-to'g'ri yangisiga
    cur.execute("UPDATE product_aliases a SET new_id = m.new FROM _alias_map m WHERE a.new_id = m.old")

    moved = {}
    cur.execute("UPDATE price_history h SET product_id = m.new FROM _alias_map m WHERE h.product_id = m.old")
    moved["price_history"] = cur.rowcount
    for table in ("user_events",):
        cur.execute("SELECT to_regclass(%s)", (table,))
        if cur.fetchone()[0]:
            cur.execute(f"UPDATE {table} t SET product_id = m.new FROM _alias_map m WHERE t.product_id = m.old")
            moved[table] = cur.rowcount
    # Sevimlilar / kuzatuv: (user_id, product_id) kalit. Foydalanuvchi bitta
    # modelning ikki rangini saqlagan bo'lsa, ular bitta yozuvga aylanadi.
    for table in ("user_favorites", "user_watchlist"):
        cur.execute("SELECT to_regclass(%s)", (table,))
        if not cur.fetchone()[0]:
            continue
        cur.execute(f"""
            INSERT INTO {table} (user_id, product_id, product_data, created_at)
            SELECT DISTINCT ON (t.user_id, m.new) t.user_id, m.new, t.product_data, t.created_at
            FROM {table} t JOIN _alias_map m ON t.product_id = m.old
            ORDER BY t.user_id, m.new, t.created_at
            ON CONFLICT (user_id, product_id) DO NOTHING
        """)
        cur.execute(f"DELETE FROM {table} t USING _alias_map m WHERE t.product_id = m.old")
        moved[table] = cur.rowcount
    print(f"[alias] {len(pairs)} ta eski mahsulot yangisiga bog'landi; ko'chirildi: "
          + ", ".join(f"{k} {v}" for k, v in moved.items()), flush=True)
