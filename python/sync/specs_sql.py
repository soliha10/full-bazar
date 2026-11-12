"""product_specs jadvalining sxemasi va UPSERT so'rovi (python/sync_specs.py uchun)."""

# API ham shu jadvalni yaratadi; bu skript undan oldin ishlashi mumkin,
# shuning uchun sxema shu yerda ham ta'minlanadi.
DDL = """
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
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_specs_model
    ON product_specs(brand, model_key);
ALTER TABLE product_specs
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'seed';
ALTER TABLE product_specs
    ADD COLUMN IF NOT EXISTS source_url TEXT;
"""

# CSV — yagona manba, LEKIN u har doim ham to'liq emas: ro'yxat sahifasidan
# olingan qator kamera/zaryadlash/OS siz keladi. Bunday bo'sh qiymat bazadagi
# model sahifasidan olingan tayyor ma'lumotni O'CHIRIB yubormasligi kerak —
# shuning uchun har maydon COALESCE bilan yangilanadi: yangi qiymat bo'sh
# bo'lsa eskisi qoladi. (Ilgari CI har ishdan oldin bazani CSV ga eksport
# qilib shu himoyani ta'minlardi; endi yig'ish mahalliy bo'lgani uchun
# himoya shu yerda turadi.)
UPSERT = """
INSERT INTO product_specs
    (brand, model_key, display_name, display, chipset, ram_options,
     storage_options, main_camera, selfie_camera, battery_mah,
     charging, os, body, release_year, source, source_url)
VALUES %s
ON CONFLICT (brand, model_key) DO UPDATE SET
    display_name    = COALESCE(NULLIF(EXCLUDED.display_name, ''), product_specs.display_name),
    display         = COALESCE(EXCLUDED.display,         product_specs.display),
    chipset         = COALESCE(EXCLUDED.chipset,         product_specs.chipset),
    ram_options     = CASE WHEN EXCLUDED.ram_options = '{}'
                           THEN product_specs.ram_options ELSE EXCLUDED.ram_options END,
    storage_options = CASE WHEN EXCLUDED.storage_options = '{}'
                           THEN product_specs.storage_options ELSE EXCLUDED.storage_options END,
    main_camera     = COALESCE(EXCLUDED.main_camera,     product_specs.main_camera),
    selfie_camera   = COALESCE(EXCLUDED.selfie_camera,   product_specs.selfie_camera),
    battery_mah     = COALESCE(EXCLUDED.battery_mah,     product_specs.battery_mah),
    charging        = COALESCE(EXCLUDED.charging,        product_specs.charging),
    os              = COALESCE(EXCLUDED.os,              product_specs.os),
    body            = COALESCE(EXCLUDED.body,            product_specs.body),
    release_year    = COALESCE(EXCLUDED.release_year,    product_specs.release_year),
    source          = EXCLUDED.source,
    source_url      = COALESCE(EXCLUDED.source_url,      product_specs.source_url)
"""
