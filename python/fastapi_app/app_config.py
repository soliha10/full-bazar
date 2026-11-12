"""Muhit sozlamalari: baza manzili, ML model yo'li va JWT kaliti."""

from __future__ import annotations

import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@postgres:5432/fullbazar",
)
MODEL_PATH = os.getenv("MODEL_PATH", "/app/data/models/best_matcher.pkl")

# ── Auth config ───────────────────────────────────────────────────────────────
_JWT_SECRET = os.getenv("JWT_SECRET")
if not _JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET environment variable must be set — refusing to start with no "
        "secret configured, since that would let anyone forge auth tokens"
    )
_JWT_ALGO = "HS256"
_JWT_EXPIRE_DAYS = 7
