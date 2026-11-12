"""Ishga tushishda jadvallar, indekslar va spec seed ni tayyorlash."""

from __future__ import annotations

import asyncpg

from catalog import _store_specs
from specs_seed import SPEC_SEED

# ── Lifespan ──────────────────────────────────────────────────────────────────

async def _prepare_db(pool: asyncpg.Pool) -> None:
    """Jadvallar/indekslar va spec seed — ulanish ochilgandan keyin bir marta."""
    async with pool.acquire() as conn:
        # Auth tables (may not exist on volumes created before auth was added)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                name          VARCHAR(100) NOT NULL,
                email         VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at    TIMESTAMPTZ  DEFAULT NOW(),
                updated_at    TIMESTAMPTZ  DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(lower(email))
        """)
        await conn.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ
        """)
        # Telefon bilan ro'yxatdan o'tish: email endi majburiy emas, lekin
        # email yoki telefondan bittasi bo'lishi shart.
        await conn.execute("""
            ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
            DO $$ BEGIN
                ALTER TABLE users ADD CONSTRAINT users_email_or_phone
                    CHECK (email IS NOT NULL OR phone IS NOT NULL);
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        """)
        # Tasdiqlash kodlari: kodning o'zi emas, HMAC i saqlanadi (otp.hash_code)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS verification_codes (
                id          BIGSERIAL    PRIMARY KEY,
                channel     VARCHAR(5)   NOT NULL,
                target      VARCHAR(254) NOT NULL,
                purpose     VARCHAR(20)  NOT NULL,
                code_hash   CHAR(64)     NOT NULL,
                attempts    SMALLINT     NOT NULL DEFAULT 0,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                expires_at  TIMESTAMPTZ  NOT NULL,
                consumed_at TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS idx_verification_codes_target
                ON verification_codes(target, purpose, created_at DESC);
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id              UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                age_group            VARCHAR(10) NOT NULL DEFAULT '25-34',
                budget_level         VARCHAR(10) NOT NULL DEFAULT 'mid',
                preferred_brands     TEXT[]      NOT NULL DEFAULT '{}',
                preferred_categories TEXT[]      NOT NULL DEFAULT '{}',
                updated_at           TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        # Favorites & watchlist tables
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_favorites (
                user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_id   VARCHAR(60) NOT NULL,
                product_data JSONB       NOT NULL DEFAULT '{}',
                created_at   TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (user_id, product_id)
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_watchlist (
                user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_id   VARCHAR(60) NOT NULL,
                product_data JSONB       NOT NULL DEFAULT '{}',
                created_at   TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (user_id, product_id)
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id          BIGSERIAL      PRIMARY KEY,
                product_id  VARCHAR(60)    NOT NULL,
                source      VARCHAR(100)   NOT NULL,
                price       DECIMAL(15, 2) NOT NULL,
                recorded_at TIMESTAMPTZ    DEFAULT NOW()
            )
        """)
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, recorded_at DESC)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at DESC)"
        )
        # ── Products qidiruv/tartib indekslari ────────────────────────────────
        # /api/products har doim `ORDER BY p.price` bilan tartiblaydi va
        # `lower(name) LIKE '%...%'` bo'yicha qidiradi. init.sql dagi
        # to_tsvector GIN indeksi LIKE uchun umuman ishlamaydi — Postgres uni
        # e'tiborsiz qoldirib, butun jadvalni skanerlaydi. pg_trgm esa aynan
        # ikki tomoni ochiq LIKE naqshlari uchun mo'ljallangan.
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)")
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_products_name_trgm
                ON products USING GIN (lower(name) gin_trgm_ops)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_products_keywords_trgm
                ON products USING GIN (lower(COALESCE(keywords, '')) gin_trgm_ops)
            """)
        except asyncpg.PostgresError as exc:
            # pg_trgm ni yoqish uchun huquq bo'lmasligi mumkin (boshqariladigan
            # hosting). Qidiruv baribir ishlaydi, faqat sekinroq — startupni
            # buning uchun to'xtatmaymiz.
            print(f"[startup] pg_trgm indekslari o'rnatilmadi: {exc}")
        # Telegram chat_id column (added later — safe to run on existing installs)
        await conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT DEFAULT NULL
        """)
        # User feedback
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
                name       VARCHAR(100),
                email      VARCHAR(255),
                rating     SMALLINT,
                message    TEXT        NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        # Mahsulot manzili faqat nomdan iborat bo'lishi uchun slug ustuni.
        # sync_csv.py uni to'ldiradi; bu yerdagi ALTER eski bazalar uchun.
        await conn.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(200)")
        await conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)"
        )
        # Product spec sheet (for the compare feature) — seeded from specs_seed.py
        await conn.execute("""
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
            )
        """)
        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_product_specs_model
            ON product_specs(brand, model_key)
        """)
        # 'seed'  — specs_seed.py dagi qo'lda yozilgan yozuvlar
        # 'gsmarena' — python/sync_specs.py orqali yig'ilgan aniqroq ma'lumot
        await conn.execute("""
            ALTER TABLE product_specs
                ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'seed'
        """)
        await conn.execute("""
            ALTER TABLE product_specs ADD COLUMN IF NOT EXISTS source_url TEXT
        """)
        await conn.executemany(
            """
            INSERT INTO product_specs
                (brand, model_key, display_name, display, chipset, ram_options,
                 storage_options, main_camera, selfie_camera, battery_mah,
                 charging, os, body, release_year, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'seed')
            ON CONFLICT (brand, model_key) DO UPDATE SET
                display_name = EXCLUDED.display_name, display = EXCLUDED.display,
                chipset = EXCLUDED.chipset, ram_options = EXCLUDED.ram_options,
                storage_options = EXCLUDED.storage_options, main_camera = EXCLUDED.main_camera,
                selfie_camera = EXCLUDED.selfie_camera, battery_mah = EXCLUDED.battery_mah,
                charging = EXCLUDED.charging, os = EXCLUDED.os, body = EXCLUDED.body,
                release_year = EXCLUDED.release_year
            -- GSMArena dan yig'ilgan yozuvlarga tegmaymiz: ular aniqroq va
            -- API har qayta ishga tushganda seed ularni bosib ketmasligi kerak.
            WHERE product_specs.source = 'seed'
            """,
            [
                (
                    s["brand"], s["model_key"], s["display_name"], s["display"], s["chipset"],
                    s["ram_options"], s["storage_options"], s["main_camera"], s["selfie_camera"],
                    s["battery_mah"], s["charging"], s["os"], s["body"], s["release_year"],
                )
                for s in SPEC_SEED
            ],
        )
        spec_rows = await conn.fetch("SELECT * FROM product_specs")
        _store_specs([dict(r) for r in spec_rows])
