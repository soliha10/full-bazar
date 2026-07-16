"""
FastAPI service — serves product data from PostgreSQL.
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import pickle
import re
import time
import uuid
from collections import Counter, defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

import asyncpg
import bcrypt
import jwt as pyjwt
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, EmailStr, Field, field_validator
from starlette.middleware.base import BaseHTTPMiddleware

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@postgres:5432/fullbazar",
)
MODEL_PATH = os.getenv("MODEL_PATH", "/app/data/models/best_matcher.pkl")

# ── Auth config ───────────────────────────────────────────────────────────────
_JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
_JWT_ALGO = "HS256"
_JWT_EXPIRE_DAYS = 7
_bearer = HTTPBearer(auto_error=False)


def _hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def _verify_pw(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def _make_token(user_id: str) -> str:
    exp = datetime.now(tz=timezone.utc) + timedelta(days=_JWT_EXPIRE_DAYS)
    return pyjwt.encode({"sub": user_id, "exp": exp}, _JWT_SECRET, algorithm=_JWT_ALGO)


async def _require_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> asyncpg.Record:
    """FastAPI dependency — decodes JWT and fetches the user row."""
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, _JWT_SECRET, algorithms=[_JWT_ALGO])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    pool: asyncpg.Pool = app.state.pool
    row = await pool.fetchrow(
        """
        SELECT u.id, u.name, u.email,
               COALESCE(p.age_group,            '25-34') AS age_group,
               COALESCE(p.budget_level,          'mid')   AS budget_level,
               COALESCE(p.preferred_brands,      '{}')    AS preferred_brands,
               COALESCE(p.preferred_categories,  '{}')    AS preferred_categories
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1
        """,
        uuid.UUID(user_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return row


async def _optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[asyncpg.Record]:
    """Like _require_user, but returns None instead of raising when not authenticated."""
    if creds is None:
        return None
    try:
        return await _require_user(creds)
    except HTTPException:
        return None


# ── Auth Pydantic models ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:                 str                                       = Field(..., min_length=2, max_length=100)
    email:                EmailStr
    password:             str                                       = Field(..., min_length=8, max_length=128)
    age_group:            Literal["18-24", "25-34", "35-44", "45+"] = "25-34"
    budget_level:         Literal["budget", "mid", "premium"]       = "mid"
    preferred_brands:     list[str]                                 = []
    preferred_categories: list[str]                                 = []

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("preferred_brands", "preferred_categories")
    @classmethod
    def cap_list(cls, v: list[str]) -> list[str]:
        return [s.strip() for s in v[:20] if s.strip()]


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(..., min_length=1)


class UpdateProfileRequest(BaseModel):
    age_group:            Literal["18-24", "25-34", "35-44", "45+"]
    budget_level:         Literal["budget", "mid", "premium"]
    preferred_brands:     list[str] = []
    preferred_categories: list[str] = []


# ── ML matcher (loaded once at startup) ──────────────────────────────────────
# Mirrors the feature set in python/ml_tasks/train_matcher.py exactly.
# If the model file doesn't exist yet (before first training run), all
# /api/ml/match requests fall back to plain cosine similarity.

_BRANDS = [
    "apple", "samsung", "xiaomi", "redmi", "oppo", "vivo", "realme",
    "honor", "huawei", "tecno", "infinix", "poco", "itel",
]

_BRAND_KWS: dict[str, list[str]] = {
    "Apple":   ["apple", "iphone"],
    "Samsung": ["samsung", "galaxy"],
    "Redmi":   ["redmi"],
    "Xiaomi":  ["xiaomi"],
    "Poco":    ["poco"],
    "Honor":   ["honor"],
    "Vivo":    ["vivo"],
    "Oppo":    ["oppo"],
    "Realme":  ["realme"],
    "Tecno":   ["tecno", "camon", "spark"],
    "Infinix": ["infinix"],
}
_STORAGE_RE = re.compile(r"(\d+)\s*(?:gb|tb)", re.I)
_DIFF_RE = re.compile(
    r"\b(pro|max|plus|ultra|lite|mini|fe|note|edge|fold|se|\d+)\b", re.I
)

_matcher: dict | None = None  # {"model": ..., "vectorizer": ..., "features": [...]}


def _load_matcher() -> dict | None:
    global _matcher
    if _matcher is not None:
        return _matcher
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _matcher = pickle.load(f)
            print(f"Loaded matcher model from {MODEL_PATH}")
        except Exception as e:
            print(f"Failed to load matcher model: {e}")
    return _matcher


def _extract_storage(text: str) -> str:
    m = _STORAGE_RE.search(text)
    return m.group(1).lower() if m else ""


def _extract_brand(text: str) -> str:
    text = text.lower()
    for b in _BRANDS:
        if b in text:
            return b
    return ""


def _jaccard(a: str, b: str) -> float:
    wa, wb = set(a.split()), set(b.split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _diff_tokens(text: str) -> frozenset:
    return frozenset(_DIFF_RE.findall(text.lower()))


def _cosine_sim_words(s1: str, s2: str) -> float:
    """Word-level cosine similarity — fallback when no trained model."""
    v1 = Counter(re.findall(r"\w+", s1.lower()))
    v2 = Counter(re.findall(r"\w+", s2.lower()))
    shared = set(v1) & set(v2)
    num = sum(v1[x] * v2[x] for x in shared)
    den = math.sqrt(sum(v ** 2 for v in v1.values())) * math.sqrt(sum(v ** 2 for v in v2.values()))
    return float(num) / den if den else 0.0


def _ml_match(name_a: str, name_b: str) -> tuple[float, bool, str]:
    """Return (score, is_match, model_used)."""
    matcher = _load_matcher()

    if matcher is None:
        score = _cosine_sim_words(name_a, name_b)
        return score, score > 0.65, "cosine_baseline"

    import numpy as np
    from sklearn.metrics.pairwise import paired_cosine_distances

    a, b = name_a.lower(), name_b.lower()
    vec = matcher["vectorizer"]
    va = vec.transform([a])
    vb = vec.transform([b])
    cosine_sim = float(1 - paired_cosine_distances(va, vb)[0])

    features = np.array([[
        cosine_sim,
        _jaccard(a, b),
        int(_extract_brand(a) == _extract_brand(b)),
        int(bool(_extract_brand(a)) and bool(_extract_brand(b))),
        int(
            bool(_extract_storage(a)) and bool(_extract_storage(b))
            and _extract_storage(a) != _extract_storage(b)
        ),
        1.0 if _diff_tokens(a) == _diff_tokens(b) else 0.0,
        min(max(len(a) / max(len(b), 1), 0.0), 3.0),
    ]])

    score = float(matcher["model"].predict_proba(features)[0][1])
    is_match = bool(matcher["model"].predict(features)[0] == 1)
    return score, is_match, "trained_classifier"


# ── JSONB codec ───────────────────────────────────────────────────────────────

async def _setup_jsonb_codec(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(
        DATABASE_URL, min_size=2, max_size=10, init=_setup_jsonb_codec,
    )
    _load_matcher()  # warm up model at startup
    async with app.state.pool.acquire() as conn:
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
    yield
    await app.state.pool.close()


_ALLOWED_ORIGINS = [
    "https://bazarcom.online",
    "https://www.bazarcom.online",
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1",
]

_rate_store: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT = 60   # requests
_RATE_WINDOW = 60  # seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - _RATE_WINDOW
        _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]
        if len(_rate_store[ip]) >= _RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests"},
                headers={"Retry-After": str(_RATE_WINDOW)},
            )
        _rate_store[ip].append(now)
        return await call_next(request)


app = FastAPI(
    title="Full-Bazar API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ── ML endpoints ──────────────────────────────────────────────────────────────

@app.get("/api/ml/match")
async def ml_match(name_a: str, name_b: str):
    score, is_match, model_used = _ml_match(name_a, name_b)
    return {
        "score": round(score, 4),
        "is_match": is_match,
        "model": model_used,
        "recommendation": "Match" if is_match else "Different Product",
    }


@app.get("/api/ml/samples")
async def ml_samples():
    """Test pairs with expected outcomes — useful for smoke-testing the model."""
    cases = [
        {"a": "Apple iPhone 14 Pro 128GB Black", "b": "iPhone 14 Pro 128 GB (Black)", "expected": True},
        {"a": "Samsung Galaxy S23 Ultra", "b": "Samsung S23 Ultra 256GB", "expected": True},
        {"a": "Xiaomi Redmi Note 12", "b": "Redmi Note 12 Pro", "expected": False},
        {"a": "iPhone 15 128GB", "b": "iPhone 15 256GB", "expected": False},
        {"a": "Samsung Galaxy A54 128GB", "b": "Samsung Galaxy A54 256GB", "expected": False},
    ]
    results = []
    for c in cases:
        score, is_match, model = _ml_match(c["a"], c["b"])
        results.append({**c, "score": round(score, 4), "predicted": is_match, "model": model})
    return results


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_product(row: asyncpg.Record, markets: list[dict]) -> dict[str, Any]:
    sorted_markets = sorted(markets, key=lambda m: m["price"])
    best = sorted_markets[0] if sorted_markets else {}
    return {
        "id": row["id"],
        "name": row["name"],
        "title": row["title"],
        "category": row["category"],
        "rating": float(row["rating"]) if row["rating"] is not None else None,
        "reviews": row["reviews"],
        "image": row["image"] or "",
        "images": list(row["images"] or []),
        "inStock": row["in_stock"],
        "keywords": row["keywords"] or "",
        "source": best.get("source", row["source"] or ""),
        "price": float(best.get("price", row["price"] or 0)),
        "url": best.get("url", row["url"] or "#"),
        "markets": sorted_markets,
    }


async def _fetch_markets(pool: asyncpg.Pool, product_ids: list[str]) -> dict[str, list[dict]]:
    if not product_ids:
        return {}
    rows = await pool.fetch(
        "SELECT product_id, source, price, url FROM product_markets WHERE product_id = ANY($1) ORDER BY price",
        product_ids,
    )
    result: dict[str, list[dict]] = {pid: [] for pid in product_ids}
    for r in rows:
        result[r["product_id"]].append({
            "source": r["source"],
            "price": float(r["price"]),
            "url": r["url"] or "#",
        })
    return result


# ── Products ──────────────────────────────────────────────────────────────────

@app.get("/api/products")
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=200),
    search: str = Query(""),
    market: str = Query(""),
    brand: str = Query(""),
    category: str = Query(""),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    offset = (page - 1) * limit
    search = search.strip()
    market = market.strip().lower()
    brand = brand.strip()
    category = category.strip()

    where_parts: list[str] = []
    params: list = []

    if category and category.lower() != "all":
        params.append(category)
        where_parts.append(f"p.category = ${len(params)}")

    if search:
        for token in search.lower().split():
            params.append(f"%{token}%")
            i = len(params)
            where_parts.append(f"(lower(p.name) LIKE ${i} OR lower(p.keywords) LIKE ${i})")

    if brand:
        kws = _BRAND_KWS.get(brand, [brand.lower()])
        brand_parts = []
        for kw in kws:
            params.append(f"%{kw}%")
            i = len(params)
            brand_parts.append(f"(lower(p.name) LIKE ${i} OR lower(p.keywords) LIKE ${i})")
        where_parts.append(f"({' OR '.join(brand_parts)})")

    if market:
        markets_list = [m.strip() for m in market.split(",") if m.strip()]
        if markets_list:
            params.append(markets_list)
            i = len(params)
            where_parts.append(
                f"EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id AND lower(pm.source) = ANY(${i}::text[]))"
            )

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    count_row = await pool.fetchrow(f"SELECT COUNT(*) FROM products p {where_sql}", *params)
    total: int = count_row[0]

    rows = await pool.fetch(
        f"SELECT p.* FROM products p {where_sql} ORDER BY p.price ASC LIMIT ${len(params)+1} OFFSET ${len(params)+2}",
        *params, limit, offset,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    products = [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]

    return {"products": products, "total": total, "page": page, "limit": limit, "hasMore": offset + limit < total}


@app.get("/api/products/{product_id}")
async def get_product(product_id: str) -> dict:
    pool: asyncpg.Pool = app.state.pool
    row = await pool.fetchrow("SELECT * FROM products WHERE id = $1", product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not Found")
    markets_map = await _fetch_markets(pool, [product_id])
    return _row_to_product(row, markets_map.get(product_id, []))


# ── Recommendations ───────────────────────────────────────────────────────────

@app.get("/api/recommendations")
async def get_recommendations(limit: int = Query(4, ge=1, le=10)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        """
        WITH market_stats AS (
            SELECT product_id,
                   MIN(price) as min_price,
                   MAX(price) as max_price,
                   COUNT(*) as market_count
            FROM product_markets
            GROUP BY product_id
            HAVING COUNT(*) > 1
        )
        SELECT p.*, ms.max_price - ms.min_price as savings
        FROM products p
        JOIN market_stats ms ON p.id = ms.product_id
        ORDER BY savings DESC
        LIMIT $1
        """,
        limit,
    )
    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    return {"products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows]}


@app.get("/api/recommendations/personalized")
async def get_personalized_recommendations(
    session_id: str = Query(...),
    limit: int = Query(8, ge=1, le=20),
) -> dict:
    pool: asyncpg.Pool = app.state.pool

    # Fetch recent events with timestamps for time-decay scoring
    event_rows = await pool.fetch(
        """
        SELECT product_id, event_type,
               EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 AS hours_ago
        FROM user_events
        WHERE session_id = $1
          AND product_id IS NOT NULL
          AND event_type IN ('view', 'search', 'cart_add')
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 50
        """,
        session_id,
    )

    if not event_rows:
        # Cold start: fall back to best price-diff products
        rows = await pool.fetch(
            """
            WITH ms AS (
                SELECT product_id, MIN(price) AS lo, MAX(price) AS hi
                FROM product_markets GROUP BY product_id HAVING COUNT(*) > 1
            )
            SELECT p.* FROM products p
            JOIN ms ON p.id = ms.product_id
            ORDER BY (ms.hi - ms.lo) DESC
            LIMIT $1
            """,
            limit,
        )
        product_ids = [r["id"] for r in rows]
        markets_map = await _fetch_markets(pool, product_ids)
        return {"products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows], "type": "popular"}

    # Score each product using event type weight + exponential time decay.
    # cart_add is the strongest signal (3×), view is baseline (1×).
    # Decay half-life ≈ 7 hours: score halves every 7 hours of inactivity.
    EVENT_WEIGHTS = {"view": 1.0, "search": 1.5, "cart_add": 3.0}
    DECAY_RATE = math.log(2) / 7.0  # λ for 7-hour half-life

    product_scores: dict[str, float] = {}
    for r in event_rows:
        pid = r["product_id"]
        weight = EVENT_WEIGHTS.get(r["event_type"], 1.0)
        decay = math.exp(-DECAY_RATE * float(r["hours_ago"]))
        product_scores[pid] = product_scores.get(pid, 0.0) + weight * decay

    viewed_ids = list(product_scores.keys())
    # Top-scored products define the user profile
    top_viewed = sorted(viewed_ids, key=product_scores.get, reverse=True)[:10]

    profile_rows = await pool.fetch(
        "SELECT category, AVG(price) AS avg_price FROM products WHERE id = ANY($1) GROUP BY category",
        top_viewed,
    )
    if not profile_rows:
        return {"products": [], "type": "empty"}

    brand_rows = await pool.fetch(
        "SELECT lower(split_part(name, ' ', 1)) AS brand FROM products WHERE id = ANY($1)",
        top_viewed,
    )
    brands = list({r["brand"] for r in brand_rows if r["brand"]})
    categories = [r["category"] for r in profile_rows]
    avg_price = float(sum(r["avg_price"] for r in profile_rows) / len(profile_rows))

    rows = await pool.fetch(
        """
        SELECT p.*,
            CASE WHEN lower(split_part(p.name, ' ', 1)) = ANY($4::text[]) THEN 2 ELSE 1 END AS boost
        FROM products p
        WHERE p.category = ANY($1::text[])
          AND p.id != ALL($2::text[])
          AND p.price BETWEEN $3 * 0.4 AND $3 * 2.5
        ORDER BY boost DESC, p.rating DESC
        LIMIT $5
        """,
        categories, viewed_ids, avg_price, brands, limit,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)
    return {
        "products": [_row_to_product(r, markets_map.get(r["id"], [])) for r in rows],
        "type": "personalized",
    }


# ── Trend Analysis endpoints ──────────────────────────────────────────────────

@app.get("/api/products/{product_id}/price-history")
async def get_price_history(
    product_id: str,
    days: int = Query(30, ge=1, le=365),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        """
        SELECT source, price, recorded_at
        FROM price_history
        WHERE product_id = $1
          AND recorded_at > NOW() - ($2 || ' days')::INTERVAL
        ORDER BY recorded_at ASC
        """,
        product_id, str(days),
    )
    history = [
        {
            "source": r["source"],
            "price": float(r["price"]),
            "date": r["recorded_at"].isoformat(),
        }
        for r in rows
    ]
    return {"product_id": product_id, "days": days, "history": history}


@app.get("/api/trends")
async def get_trends(limit: int = Query(8, ge=1, le=20)) -> dict:
    pool: asyncpg.Pool = app.state.pool

    rows = await pool.fetch(
        """
        WITH latest AS (
            SELECT DISTINCT ON (product_id, source)
                product_id, source, price, recorded_at
            FROM price_history
            ORDER BY product_id, source, recorded_at DESC
        ),
        oldest AS (
            SELECT DISTINCT ON (product_id, source)
                product_id, source, price, recorded_at
            FROM price_history
            WHERE recorded_at < NOW() - INTERVAL '3 days'
            ORDER BY product_id, source, recorded_at ASC
        ),
        changes AS (
            SELECT
                l.product_id,
                l.price        AS current_price,
                o.price        AS old_price,
                l.price - o.price AS price_change,
                CASE WHEN o.price > 0
                     THEN ROUND((l.price - o.price) / o.price * 100, 1)
                     ELSE 0 END AS pct_change
            FROM latest l
            JOIN oldest o ON o.product_id = l.product_id AND o.source = l.source
        ),
        aggregated AS (
            SELECT product_id,
                   MIN(current_price) AS current_price,
                   SUM(price_change)  AS total_change,
                   AVG(pct_change)    AS avg_pct
            FROM changes
            GROUP BY product_id
        )
        SELECT p.*, a.current_price, a.total_change, a.avg_pct
        FROM aggregated a
        JOIN products p ON p.id = a.product_id
        ORDER BY ABS(a.total_change) DESC
        LIMIT $1
        """,
        limit,
    )

    product_ids = [r["id"] for r in rows]
    markets_map = await _fetch_markets(pool, product_ids)

    dropping, rising = [], []
    for r in rows:
        change = float(r["total_change"] or 0)
        pct = float(r["avg_pct"] or 0)
        item = {
            **_row_to_product(r, markets_map.get(r["id"], [])),
            "priceChange": round(change, 2),
            "pctChange": round(pct, 1),
        }
        if change < 0:
            dropping.append(item)
        else:
            rising.append(item)

    return {"dropping": dropping, "rising": rising}


@app.get("/api/stats")
async def get_stats() -> dict:
    pool: asyncpg.Pool = app.state.pool
    products_count = await pool.fetchval("SELECT COUNT(*) FROM products")
    markets_count = await pool.fetchval("SELECT COUNT(DISTINCT source) FROM product_markets")
    history_count = await pool.fetchval("SELECT COUNT(*) FROM price_history")
    return {
        "products": products_count,
        "markets": markets_count,
        "priceSnapshots": history_count,
    }


# ── Other endpoints ───────────────────────────────────────────────────────────

@app.get("/api/markets")
async def get_markets() -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        "SELECT lower(source) AS key, source AS name, COUNT(*) AS count FROM product_markets GROUP BY source ORDER BY count DESC"
    )
    return {"markets": [{"key": r["key"], "name": r["name"], "count": r["count"]} for r in rows]}


@app.get("/api/search-trends")
async def search_trends(days: int = Query(7, ge=1, le=30), limit: int = Query(15, ge=1, le=50)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        """
        SELECT
            search_query,
            COUNT(*)                   AS total,
            COUNT(DISTINCT session_id) AS unique_sessions
        FROM user_events
        WHERE event_type = 'search'
          AND search_query IS NOT NULL
          AND search_query <> ''
          AND created_at > NOW() - ($2 || ' days')::INTERVAL
        GROUP BY search_query
        ORDER BY total DESC
        LIMIT $1
        """,
        limit, days,
    )
    return {
        "days": days,
        "trends": [
            {"query": r["search_query"], "count": int(r["total"]), "uniqueSessions": int(r["unique_sessions"])}
            for r in rows
        ],
    }


@app.get("/api/market-analytics")
async def market_analytics() -> dict:
    pool: asyncpg.Pool = app.state.pool
    market_rows = await pool.fetch(
        """
        SELECT
            pm.source,
            COUNT(DISTINCT pm.product_id)          AS product_count,
            ROUND(AVG(pm.price)::numeric, 0)        AS avg_price,
            ROUND(MIN(pm.price)::numeric, 0)        AS min_price,
            ROUND(MAX(pm.price)::numeric, 0)        AS max_price
        FROM product_markets pm
        GROUP BY pm.source
        ORDER BY product_count DESC
        """
    )
    popular_rows = await pool.fetch(
        """
        SELECT
            ue.product_id,
            p.name,
            p.price,
            p.image,
            COUNT(*) AS view_count
        FROM user_events ue
        JOIN products p ON p.id = ue.product_id
        WHERE ue.event_type = 'view'
          AND ue.product_id IS NOT NULL
          AND ue.created_at > NOW() - INTERVAL '7 days'
        GROUP BY ue.product_id, p.name, p.price, p.image
        ORDER BY view_count DESC
        LIMIT 8
        """
    )
    total_events = await pool.fetchval(
        "SELECT COUNT(*) FROM user_events WHERE created_at > NOW() - INTERVAL '7 days'"
    )
    return {
        "markets": [
            {
                "source": r["source"],
                "productCount": int(r["product_count"]),
                "avgPrice": float(r["avg_price"] or 0),
                "minPrice": float(r["min_price"] or 0),
                "maxPrice": float(r["max_price"] or 0),
            }
            for r in market_rows
        ],
        "popularProducts": [
            {
                "id": r["product_id"],
                "name": r["name"],
                "price": float(r["price"] or 0),
                "image": r["image"],
                "viewCount": int(r["view_count"]),
            }
            for r in popular_rows
        ],
        "weeklyEvents": int(total_events or 0),
    }


class TrackEvent(BaseModel):
    session_id: str
    event_type: str  # 'view' | 'search' | 'cart_add'
    product_id: Optional[str] = None
    search_query: Optional[str] = None


@app.post("/api/track")
async def track_event(event: TrackEvent):
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        "INSERT INTO user_events (session_id, event_type, product_id, search_query) VALUES ($1, $2, $3, $4)",
        event.session_id, event.event_type, event.product_id, event.search_query,
    )
    return {"ok": True}


@app.get("/health")
async def health() -> dict:
    matcher = _load_matcher()
    return {"status": "ok", "matcher_model": "loaded" if matcher else "not_trained_yet"}


# ── Auth endpoints ────────────────────────────────────────────────────────────

def _user_payload(row: asyncpg.Record, extra: dict | None = None) -> dict:
    """Shape the user object the frontend expects."""
    profile_src = extra or row
    return {
        "id":    str(row["id"]),
        "name":  row["name"],
        "email": row["email"],
        "profile": {
            "name":                 row["name"],
            "email":                row["email"],
            "ageGroup":             profile_src.get("age_group",            "25-34"),
            "budgetLevel":          profile_src.get("budget_level",          "mid"),
            "preferredBrands":      list(profile_src.get("preferred_brands",      [])),
            "preferredCategories":  list(profile_src.get("preferred_categories",  [])),
        },
    }


@app.post("/api/auth/register", status_code=201)
async def auth_register(body: RegisterRequest) -> dict:
    pool: asyncpg.Pool = app.state.pool

    existing = await pool.fetchval(
        "SELECT id FROM users WHERE lower(email) = $1", body.email.lower()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Bu email allaqachon ro'yxatdan o'tgan")

    loop = asyncio.get_running_loop()
    pw_hash = await loop.run_in_executor(None, _hash_pw, body.password)

    async with pool.acquire() as conn:
        async with conn.transaction():
            user_row = await conn.fetchrow(
                "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
                body.name, body.email.lower(), pw_hash,
            )
            await conn.execute(
                """
                INSERT INTO user_profiles
                    (user_id, age_group, budget_level, preferred_brands, preferred_categories)
                VALUES ($1, $2, $3, $4, $5)
                """,
                user_row["id"],
                body.age_group,
                body.budget_level,
                body.preferred_brands,
                body.preferred_categories,
            )

    token = _make_token(str(user_row["id"]))
    return {
        "token": token,
        "user": _user_payload(user_row, {
            "age_group":            body.age_group,
            "budget_level":         body.budget_level,
            "preferred_brands":     body.preferred_brands,
            "preferred_categories": body.preferred_categories,
        }),
    }


@app.post("/api/auth/login")
async def auth_login(body: LoginRequest) -> dict:
    pool: asyncpg.Pool = app.state.pool

    row = await pool.fetchrow(
        """
        SELECT u.id, u.name, u.email, u.password_hash,
               COALESCE(p.age_group,            '25-34') AS age_group,
               COALESCE(p.budget_level,          'mid')   AS budget_level,
               COALESCE(p.preferred_brands,      '{}')    AS preferred_brands,
               COALESCE(p.preferred_categories,  '{}')    AS preferred_categories
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE lower(u.email) = $1
        """,
        body.email.lower(),
    )

    if row is None:
        raise HTTPException(status_code=401, detail="Email yoki parol noto'g'ri")

    loop = asyncio.get_running_loop()
    ok = await loop.run_in_executor(None, _verify_pw, body.password, row["password_hash"])
    if not ok:
        raise HTTPException(status_code=401, detail="Email yoki parol noto'g'ri")

    token = _make_token(str(row["id"]))
    return {"token": token, "user": _user_payload(row)}


@app.get("/api/users/me")
async def get_me(row: asyncpg.Record = Depends(_require_user)) -> dict:
    return _user_payload(row)


@app.patch("/api/users/me/profile")
async def update_profile(
    body: UpdateProfileRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        """
        INSERT INTO user_profiles
            (user_id, age_group, budget_level, preferred_brands, preferred_categories)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
            age_group            = EXCLUDED.age_group,
            budget_level         = EXCLUDED.budget_level,
            preferred_brands     = EXCLUDED.preferred_brands,
            preferred_categories = EXCLUDED.preferred_categories,
            updated_at           = NOW()
        """,
        row["id"],
        body.age_group,
        body.budget_level,
        body.preferred_brands,
        body.preferred_categories,
    )
    return {"ok": True}


# ── User Favorites ────────────────────────────────────────────────────────────

class UserListItemRequest(BaseModel):
    product: dict


@app.get("/api/users/me/favorites")
async def get_favorites(row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    rows = await pool.fetch(
        "SELECT product_data FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC",
        row["id"],
    )
    return {"items": [r["product_data"] for r in rows]}


@app.post("/api/users/me/favorites/{product_id}", status_code=201)
async def add_favorite(
    product_id: str,
    body: UserListItemRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        """
        INSERT INTO user_favorites (user_id, product_id, product_data)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET product_data = EXCLUDED.product_data
        """,
        row["id"], product_id, body.product,
    )
    return {"ok": True}


@app.delete("/api/users/me/favorites/{product_id}")
async def remove_favorite(
    product_id: str,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        "DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2",
        row["id"], product_id,
    )
    return {"ok": True}


# ── User Watchlist ─────────────────────────────────────────────────────────────

@app.get("/api/users/me/watchlist")
async def get_watchlist(row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    async with pool.acquire() as conn:
        watch_rows = await conn.fetch(
            """
            SELECT w.product_id, w.product_data, p.price AS current_price
            FROM user_watchlist w
            LEFT JOIN products p ON p.id = w.product_id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
            """,
            row["id"],
        )
        if not watch_rows:
            return {"items": []}
        product_ids = [r["product_id"] for r in watch_rows]
        market_rows = await conn.fetch(
            """
            SELECT product_id, source, price, url
            FROM product_markets
            WHERE product_id = ANY($1)
            ORDER BY price
            """,
            product_ids,
        )

    markets_by_product: dict[str, list] = {}
    for m in market_rows:
        pid = m["product_id"]
        markets_by_product.setdefault(pid, []).append({
            "source": m["source"],
            "price": float(m["price"]),
            "url": m["url"] or "#",
        })

    items = []
    for r in watch_rows:
        item = dict(r["product_data"])
        pid = r["product_id"]
        if r["current_price"] is not None:
            item["current_price"] = float(r["current_price"])
        if pid in markets_by_product:
            item["current_markets"] = markets_by_product[pid]
        items.append(item)

    return {"items": items}


@app.post("/api/users/me/watchlist/{product_id}", status_code=201)
async def add_watchlist(
    product_id: str,
    body: UserListItemRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        """
        INSERT INTO user_watchlist (user_id, product_id, product_data)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET product_data = EXCLUDED.product_data
        """,
        row["id"], product_id, body.product,
    )
    return {"ok": True}


@app.delete("/api/users/me/watchlist/{product_id}")
async def remove_watchlist(
    product_id: str,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        "DELETE FROM user_watchlist WHERE user_id = $1 AND product_id = $2",
        row["id"], product_id,
    )
    return {"ok": True}


# ── Stats ─────────────────────────────────────────────────────────────────────

@app.get("/api/stats")
async def stats() -> dict:
    pool: asyncpg.Pool = app.state.pool
    row = await pool.fetchrow(
        """
        SELECT
            (SELECT COUNT(*) FROM products) AS total_products,
            (SELECT MAX(updated_at) FROM products) AS last_sync,
            (SELECT COUNT(DISTINCT source) FROM product_markets) AS total_markets
        """
    )
    markets_rows = await pool.fetch(
        "SELECT source, COUNT(*) AS count FROM product_markets GROUP BY source ORDER BY count DESC"
    )
    return {
        "total_products": row["total_products"],
        "last_sync": row["last_sync"].isoformat() if row["last_sync"] else None,
        "total_markets": row["total_markets"],
        "markets": [{"source": r["source"], "count": r["count"]} for r in markets_rows],
    }


# ── Telegram integration ───────────────────────────────────────────────────────

class TelegramLinkRequest(BaseModel):
    chat_id: int


@app.get("/api/users/me/telegram")
async def get_telegram_status(row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    chat_id = await pool.fetchval(
        "SELECT telegram_chat_id FROM user_profiles WHERE user_id = $1", row["id"]
    )
    return {"linked": chat_id is not None, "chat_id": chat_id}


@app.post("/api/users/me/telegram")
async def link_telegram(
    body: TelegramLinkRequest,
    row: asyncpg.Record = Depends(_require_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        """
        INSERT INTO user_profiles (user_id, telegram_chat_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE SET telegram_chat_id = EXCLUDED.telegram_chat_id
        """,
        row["id"], body.chat_id,
    )
    return {"ok": True}


@app.delete("/api/users/me/telegram")
async def unlink_telegram(row: asyncpg.Record = Depends(_require_user)) -> dict:
    pool: asyncpg.Pool = app.state.pool
    await pool.execute(
        "UPDATE user_profiles SET telegram_chat_id = NULL WHERE user_id = $1", row["id"]
    )
    return {"ok": True}


# ── Feedback ──────────────────────────────────────────────────────────────────

_FEEDBACK_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
_FEEDBACK_CHAT_ID = os.getenv("FEEDBACK_CHAT_ID", "")


class FeedbackRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    rating:  Optional[int] = Field(None, ge=1, le=5)
    name:    Optional[str] = Field(None, max_length=100)
    email:   Optional[EmailStr] = None

    @field_validator("message", "name")
    @classmethod
    def strip_str(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


async def _send_feedback_to_telegram(text: str) -> None:
    if not _FEEDBACK_BOT_TOKEN or not _FEEDBACK_CHAT_ID:
        return
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{_FEEDBACK_BOT_TOKEN}/sendMessage",
                json={"chat_id": _FEEDBACK_CHAT_ID, "text": text, "parse_mode": "Markdown"},
            )
    except Exception as e:
        print(f"Telegram feedback send failed: {e}")


@app.post("/api/feedback", status_code=201)
async def submit_feedback(
    body: FeedbackRequest,
    user: Optional[asyncpg.Record] = Depends(_optional_user),
) -> dict:
    pool: asyncpg.Pool = app.state.pool

    name = (user["name"] if user else None) or body.name
    email = (user["email"] if user else None) or body.email

    await pool.execute(
        """
        INSERT INTO feedback (user_id, name, email, rating, message)
        VALUES ($1, $2, $3, $4, $5)
        """,
        user["id"] if user else None,
        name, email, body.rating, body.message,
    )

    stars = "⭐" * body.rating if body.rating else "—"
    lines = [
        "📝 *Yangi fikr-mulohaza*",
        f"Baho: {stars}",
        f"Ism: {name or '—'}",
        f"Email: {email or '—'}",
        "",
        body.message,
    ]
    await _send_feedback_to_telegram("\n".join(lines))

    return {"ok": True}


# ── Image proxy (for hotlink-protected CDN images e.g. OLX) ──────────────────

@app.get("/api/proxy-image")
async def proxy_image(url: str = Query(...)) -> Response:
    import httpx
    from urllib.parse import urlparse
    parsed = urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=403, detail="Host not allowed")
    
    # Check if host is olxcdn.com, img.olxcdn.com or their subdomains
    is_allowed = (
        hostname == "olxcdn.com" or hostname.endswith(".olxcdn.com") or
        hostname == "img.olxcdn.com" or hostname.endswith(".img.olxcdn.com")
    )
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Host not allowed")
        
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=10) as client:
            resp = await client.get(
                url,
                headers={
                    "Referer": "https://www.olx.uz/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
            )
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"},
            )
    except Exception:
        raise HTTPException(status_code=502, detail="Image fetch failed")
