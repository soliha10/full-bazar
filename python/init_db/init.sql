-- Create Airflow metadata database
CREATE DATABASE airflow_db;

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
