"""
Product name matching classifier.

Features (7 total vs original 2):
  cosine_sim      — char n-gram TF-IDF cosine similarity (main text signal)
  jaccard_sim     — word-level Jaccard (handles word reordering)
  brand_match     — 1 if same brand extracted from both names
  both_have_brand — 1 if brand is identifiable in both (quality signal)
  storage_mismatch— 1 if storage sizes differ (128GB vs 256GB → not a match)
  kw_overlap      — 1 if differentiators (pro/max/ultra/model#) match exactly
  len_ratio       — length A / length B (very different lengths → likely different)

Training:
  - 5-fold stratified cross-validation for robust evaluation
  - class_weight="balanced" to handle positive/negative imbalance
  - ROC-AUC alongside F1 (AUC measures ranking quality, F1 measures threshold quality)

Output:
  Best model + vectorizer saved to {data_dir}/models/best_matcher.pkl
  for serving by FastAPI without MLflow dependency at inference time.
"""

from __future__ import annotations

import os
import pickle
import re

import mlflow
import mlflow.sklearn
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.metrics.pairwise import paired_cosine_distances
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5050")
try:
    mlflow.set_tracking_uri(MLFLOW_URI)
    mlflow.set_experiment("Product_Matching_V4")
except Exception as e:
    print(f"MLflow unavailable: {e}")

BRANDS = [
    "apple", "samsung", "xiaomi", "redmi", "oppo", "vivo", "realme",
    "honor", "huawei", "tecno", "infinix", "poco", "itel",
]
_STORAGE_RE = re.compile(r"(\d+)\s*(?:gb|tb)", re.I)
_DIFF_RE = re.compile(
    r"\b(pro|max|plus|ultra|lite|mini|fe|note|edge|fold|se|\d+)\b", re.I
)


def _extract_storage(text: str) -> str:
    m = _STORAGE_RE.search(text)
    return m.group(1).lower() if m else ""


def _extract_brand(text: str) -> str:
    text = text.lower()
    for b in BRANDS:
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


def extract_features(df: pd.DataFrame):
    """Return (X, y, vectorizer) from a dataframe with name_a/name_b/is_match columns."""
    df = df.copy()
    df["name_a"] = df["name_a"].fillna("").str.lower()
    df["name_b"] = df["name_b"].fillna("").str.lower()

    # char n-gram TF-IDF cosine similarity
    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
    vectorizer.fit(pd.concat([df["name_a"], df["name_b"]]))
    vec_a = vectorizer.transform(df["name_a"])
    vec_b = vectorizer.transform(df["name_b"])
    cosine_sim = 1 - paired_cosine_distances(vec_a, vec_b)

    # word-level Jaccard (robust to word reordering)
    jaccard_sim = [_jaccard(a, b) for a, b in zip(df["name_a"], df["name_b"])]

    # brand features
    brand_a = df["name_a"].apply(_extract_brand)
    brand_b = df["name_b"].apply(_extract_brand)
    brand_match = (brand_a == brand_b).astype(int)
    both_have_brand = ((brand_a != "") & (brand_b != "")).astype(int)

    # storage mismatch — strongest single negative signal
    storage_a = df["name_a"].apply(_extract_storage)
    storage_b = df["name_b"].apply(_extract_storage)
    storage_mismatch = (
        (storage_a != "") & (storage_b != "") & (storage_a != storage_b)
    ).astype(int)

    # differentiating keyword overlap (pro/max/model# must match for a match)
    kw_overlap = [
        1.0 if _diff_tokens(a) == _diff_tokens(b) else 0.0
        for a, b in zip(df["name_a"], df["name_b"])
    ]

    # length ratio (very different lengths → likely different products)
    len_a = df["name_a"].str.len().clip(lower=1)
    len_b = df["name_b"].str.len().clip(lower=1)
    len_ratio = (len_a / len_b).clip(upper=3.0)

    X = pd.DataFrame({
        "cosine_sim": cosine_sim,
        "jaccard_sim": jaccard_sim,
        "brand_match": brand_match,
        "both_have_brand": both_have_brand,
        "storage_mismatch": storage_mismatch,
        "kw_overlap": kw_overlap,
        "len_ratio": len_ratio,
    })
    return X, df["is_match"], vectorizer


def train(data_dir: str = "data") -> None:
    data_path = os.path.join(data_dir, "processed_matching_data.csv")
    if not os.path.exists(data_path):
        print(f"Data not found at {data_path}. Run data_engineering.py first.")
        return

    df = pd.read_csv(data_path)
    pos = int(df["is_match"].sum())
    print(f"Dataset: {len(df)} pairs  pos={pos}  neg={len(df) - pos}")

    X, y, vectorizer = extract_features(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models: dict = {
        "RandomForest": RandomForestClassifier(
            n_estimators=200, max_depth=12, class_weight="balanced", random_state=42
        ),
        "LogisticRegression": LogisticRegression(
            C=1.0, class_weight="balanced", max_iter=1000, random_state=42
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=150, max_depth=4, learning_rate=0.1, random_state=42
        ),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_f1 = -1.0
    best_model_name = ""
    best_clf = None

    for model_name, clf in models.items():
        with mlflow.start_run(run_name=model_name):
            # Cross-validation on full dataset (no data leakage from test set)
            cv_f1 = cross_val_score(clf, X, y, cv=cv, scoring="f1").mean()
            cv_auc = cross_val_score(clf, X, y, cv=cv, scoring="roc_auc").mean()

            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test)
            y_proba = clf.predict_proba(X_test)[:, 1]

            metrics = {
                "cv_f1": round(float(cv_f1), 4),
                "cv_roc_auc": round(float(cv_auc), 4),
                "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
                "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
                "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
                "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
            }

            print(
                f"[{model_name}]  CV_F1={metrics['cv_f1']:.3f}  "
                f"CV_AUC={metrics['cv_roc_auc']:.3f}  "
                f"F1={metrics['f1_score']:.3f}  "
                f"AUC={metrics['roc_auc']:.3f}"
            )

            mlflow.log_params({
                "model_type": model_name,
                "dataset_size": len(df),
                "n_features": len(X.columns),
                "features": str(list(X.columns)),
            })
            mlflow.log_metrics(metrics)

            try:
                mlflow.sklearn.log_model(clf, f"{model_name.lower()}_matcher")
            except Exception as e:
                print(f"  MLflow model upload failed: {e}")

            if metrics["f1_score"] > best_f1:
                best_f1 = metrics["f1_score"]
                best_model_name = model_name
                best_clf = clf

    if best_clf is not None:
        model_dir = os.path.join(data_dir, "models")
        os.makedirs(model_dir, exist_ok=True)
        artifact = {
            "model": best_clf,
            "vectorizer": vectorizer,
            "features": list(X.columns),
        }
        out_path = os.path.join(model_dir, "best_matcher.pkl")
        with open(out_path, "wb") as f:
            pickle.dump(artifact, f)
        print(f"Best model ({best_model_name}, F1={best_f1:.3f}) saved → {out_path}")


if __name__ == "__main__":
    train()
