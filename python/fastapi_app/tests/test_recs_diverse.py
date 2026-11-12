"""recs_diverse: bosh sahifa takliflarining xilma-xilligi (tarmoqsiz)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import recs_diverse as rd  # noqa: E402


def row(name):
    return {"name": name, "keywords": ""}


def test_memory_variants_are_one_model():
    assert rd.model_family("Apple iPhone Duo 1 TB") == rd.model_family("Apple iPhone Duo 12/512 GB") == "duo"
    assert rd.model_family("Apple 18 Pro Max 1 TB") == rd.model_family("Apple iPhone 18 Pro Max 2 TB")


def test_pick_dedupes_and_caps_brand():
    rows = [row(n) for n in [
        "Apple iPhone Duo 1 TB", "Apple iPhone Duo 12/512 GB", "Apple iPhone 18 Pro Max 2 TB",
        "Apple iPhone 18 Pro 2 TB", "Apple iPhone 17 Pro 1 TB", "Xiaomi 14 Ultra 16/512 GB",
        "Samsung Galaxy Z Fold8 12/256 GB",
    ]]
    names = [r["name"] for r in rd.diverse_pick(rows, 10, per_brand=3)]
    assert names == ["Apple iPhone Duo 1 TB", "Apple iPhone 18 Pro Max 2 TB", "Apple iPhone 18 Pro 2 TB",
                     "Xiaomi 14 Ultra 16/512 GB", "Samsung Galaxy Z Fold8 12/256 GB"]


def test_limit():
    rows = [row(f"Honor {i} 8/256 GB") for i in range(20)]
    assert len(rd.diverse_pick(rows, 4, per_brand=10)) == 4
