"""Mahsulot nomlarini moslashtiruvchi ML model va /api/ml/* yo'llari."""

from __future__ import annotations

import math
import os
import pickle
import re
from collections import Counter

import numpy as np
from fastapi import APIRouter
from sklearn.metrics.pairwise import paired_cosine_distances

import brands
from app_config import MODEL_PATH

router = APIRouter()


# ── ML matcher (loaded once at startup) ──────────────────────────────────────
# Mirrors the feature set in python/ml_tasks/train_matcher.py exactly.
# If the model file doesn't exist yet (before first training run), all
# /api/ml/match requests fall back to plain cosine similarity.

_STORAGE_RE = re.compile(r"(\d+)\s*(?:gb|tb)", re.I)
_DIFF_RE = re.compile(
    r"\b(pro|max|plus|ultra|lite|mini|fe|note|edge|fold|se|\d+)\b", re.I
)

_matcher: dict | None = None  # {"model": ..., "vectorizer": ..., "features": [...]}
_matcher_mtime: float = 0.0


def _load_matcher() -> dict | None:
    # Dagster (matcher_oqitish) modelni qayta o'qitib faylni almashtiradi —
    # o'zgarish vaqti yangilansa qayta yuklaymiz, API ni restart qilmasdan
    global _matcher, _matcher_mtime
    try:
        mtime = os.path.getmtime(MODEL_PATH) if MODEL_PATH else 0.0
    except OSError:
        return _matcher
    if _matcher is not None and mtime == _matcher_mtime:
        return _matcher
    try:
        with open(MODEL_PATH, "rb") as f:
            _matcher = pickle.load(f)
        _matcher_mtime = mtime
        print(f"Loaded matcher model from {MODEL_PATH}")
    except Exception as e:
        # Yozilayotgan paytda o'qilgan bo'lishi mumkin — eskisi qoladi, keyingi so'rovda yana urinamiz
        print(f"Failed to load matcher model: {e}")
    return _matcher


def _extract_storage(text: str) -> str:
    m = _STORAGE_RE.search(text)
    return m.group(1).lower() if m else ""


# Brend jadvali va nom moslashtirish endi brands.py da — scraper ham,
# sync_specs.py ham AYNAN shu funksiyalarni chaqiradi, ya'ni bu yerda
# ko'rinadigan xususiyat sahifadagisi bilan bir xil bo'lishi kafolatlangan.
_extract_brand = brands.extract_brand


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


# ── ML endpoints ──────────────────────────────────────────────────────────────

@router.get("/api/ml/match")
async def ml_match(name_a: str, name_b: str):
    score, is_match, model_used = _ml_match(name_a, name_b)
    return {
        "score": round(score, 4),
        "is_match": is_match,
        "model": model_used,
        "recommendation": "Match" if is_match else "Different Product",
    }


@router.get("/api/ml/samples")
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
