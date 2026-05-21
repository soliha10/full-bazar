-- Create Dagster metadata database
CREATE DATABASE dagster_db;

-- Create MLflow tracking database (isolated from app schema to prevent Alembic conflicts)
CREATE DATABASE mlflow;

-- Create tables in the default (fullbazar) database
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(60) PRIMARY KEY,
    name VARCHAR(1000) NOT NULL,
    title VARCHAR(1000),
    category VARCHAR(100) DEFAULT 'Phones',
    rating DECIMAL(3, 2) DEFAULT 4.5,
    reviews INTEGER DEFAULT 10,
    image VARCHAR(2000),
    images TEXT[],
    in_stock BOOLEAN DEFAULT TRUE,
    keywords TEXT,
    source VARCHAR(100),
    price DECIMAL(15, 2) DEFAULT 0,
    url VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_markets (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(60) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    url VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, source)
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products USING GIN (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_products_keywords ON products USING GIN (to_tsvector('simple', COALESCE(keywords, '')));
CREATE INDEX IF NOT EXISTS idx_product_markets_product_id ON product_markets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_markets_price ON product_markets(price);

CREATE TABLE IF NOT EXISTS user_events (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    product_id VARCHAR(60),
    search_query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_product ON user_events(product_id);

-- ── Auth ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(lower(email));

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id              UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_group            VARCHAR(10) NOT NULL DEFAULT '25-34',
    budget_level         VARCHAR(10) NOT NULL DEFAULT 'mid',
    preferred_brands     TEXT[]      NOT NULL DEFAULT '{}',
    preferred_categories TEXT[]      NOT NULL DEFAULT '{}',
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);
