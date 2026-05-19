"""
Data engineering pipeline for the product matching model.

Creates three types of training pairs from real product CSVs:

  Positive pairs  — same product title, augmented (word drop / word swap)
  Hard negatives  — same brand, different storage or model number
                    (e.g. "iPhone 15 128GB" vs "iPhone 15 256GB")
                    These are the most important: models trained without them
                    learn to match any two Apple products together.
  Easy negatives  — completely different products (random pairs)

Ratio: ~30% positives, 70% negatives (split hard/easy).
"""

from __future__ import annotations

import glob
import os
import random
import re

import pandas as pd

BRANDS = [
    "apple", "samsung", "xiaomi", "redmi", "oppo", "vivo", "realme",
    "honor", "huawei", "tecno", "infinix", "poco", "itel",
]
_STORAGE_RE = re.compile(r"(\d+)\s*(?:gb|tb)", re.I)
_DIFF_RE = re.compile(
    r"\b(?:pro|max|plus|ultra|lite|mini|fe|note|edge|fold|se|\d+)\b", re.I
)


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"(\d+)\s*(gb|tb)", r"\1\2", text)
    text = re.sub(r"[^a-z0-9\sа-я]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def augment_title(title: str) -> str:
    """Produce a slightly varied version of the title (still the same product)."""
    words = title.split()
    if len(words) < 3:
        return title + " " + random.choice(["black", "white", "new"])
    if random.random() > 0.5:
        drop_idx = random.randint(0, len(words) - 1)
        return " ".join(w for i, w in enumerate(words) if i != drop_idx)
    idx1, idx2 = random.sample(range(len(words)), 2)
    words[idx1], words[idx2] = words[idx2], words[idx1]
    return " ".join(words)


def _extract_storage(text: str) -> str:
    m = _STORAGE_RE.search(text)
    return m.group(1).lower() if m else ""


def _diff_tokens(text: str) -> frozenset:
    return frozenset(_DIFF_RE.findall(text))


def _extract_brand(text: str) -> str:
    for b in BRANDS:
        if b in text:
            return b
    return ""


def _is_hard_negative(a: str, b: str) -> bool:
    """True if a and b share a brand but differ in storage or model tokens."""
    brand_a, brand_b = _extract_brand(a), _extract_brand(b)
    if not brand_a or brand_a != brand_b:
        return False
    # storage mismatch (128gb vs 256gb — definitely different products)
    sa, sb = _extract_storage(a), _extract_storage(b)
    if sa and sb and sa != sb:
        return True
    # differentiating token mismatch (Pro vs non-Pro, Note 12 vs Note 13, etc.)
    da, db = _diff_tokens(a), _diff_tokens(b)
    return bool(da) and bool(db) and da != db


def build_data_pipeline(data_dir: str = "data") -> None:
    print("Reading and cleaning product CSVs...")
    csv_files = glob.glob(os.path.join(data_dir, "*_products.csv"))

    all_titles: list[str] = []
    for f in csv_files:
        try:
            df = pd.read_csv(f, encoding="utf-8-sig")
            col = next(
                (c for c in ("title", "product_name", "name") if c in df.columns), None
            )
            if col:
                all_titles.extend(df[col].dropna().tolist())
        except Exception as e:
            print(f"  Error reading {f}: {e}")

    cleaned = list({clean_text(t) for t in all_titles if len(str(t)) > 8})
    print(f"  {len(cleaned)} unique titles from {len(csv_files)} CSV files")

    random.seed(42)
    pairs: list[dict] = []

    # Positive pairs
    for t in cleaned:
        if random.random() > 0.7:
            pairs.append({"name_a": t, "name_b": augment_title(t), "is_match": 1})

    n_pos = len(pairs)

    # Hard negatives (within same brand, different storage/model)
    brand_buckets: dict[str, list[str]] = {}
    for t in cleaned:
        b = _extract_brand(t)
        if b:
            brand_buckets.setdefault(b, []).append(t)

    hard_negs: list[dict] = []
    target_hard = n_pos // 2
    for brand, titles in brand_buckets.items():
        if len(titles) < 2:
            continue
        for _ in range(min(len(titles) * 4, 500)):
            a, b = random.sample(titles, 2)
            if _is_hard_negative(a, b):
                hard_negs.append({"name_a": a, "name_b": b, "is_match": 0})
            if len(hard_negs) >= target_hard:
                break
        if len(hard_negs) >= target_hard:
            break

    # Easy negatives to fill the remaining quota
    n_easy = max(0, n_pos - len(hard_negs))
    easy_negs = [
        {"name_a": a, "name_b": b, "is_match": 0}
        for a, b in (random.sample(cleaned, 2) for _ in range(n_easy))
    ]

    pairs.extend(hard_negs)
    pairs.extend(easy_negs)
    real_df = pd.DataFrame(pairs)

    print(
        f"  Pairs: {n_pos} positive | {len(hard_negs)} hard negatives "
        f"| {len(easy_negs)} easy negatives"
    )

    # Merge with pre-generated synthetic data if available
    synthetic_path = os.path.join(data_dir, "synthetic_matching_data.csv")
    if os.path.exists(synthetic_path):
        synth_df = pd.read_csv(synthetic_path)
        print(f"  +{len(synth_df)} synthetic pairs")
        final_df = pd.concat([real_df, synth_df], ignore_index=True)
    else:
        final_df = real_df

    final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)
    out_path = os.path.join(data_dir, "processed_matching_data.csv")
    final_df.to_csv(out_path, index=False)
    print(f"  Done: {len(final_df)} total pairs → {out_path}")


if __name__ == "__main__":
    build_data_pipeline()
