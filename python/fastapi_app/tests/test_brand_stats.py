"""Bosh sahifadagi brend plitkalari: soni, eng arzon narx, vakil rasm."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from brand_stats import brand_stats  # noqa: E402


def _extract(text):
    for b in ("samsung", "apple", "zte"):
        if b in text.lower():
            return b
    return None


def _row(name, price, image="img", stores=1):
    return {"name": name, "keywords": "", "price": price, "image": image, "stores": stores}


def test_counts_sorted_and_display_names():
    out = brand_stats([_row("Samsung A", 1), _row("Samsung B", 2), _row("ZTE X", 3), _row("Unknown", 4)], _extract)
    assert [(b["key"], b["name"], b["count"]) for b in out] == [("samsung", "Samsung", 2), ("zte", "ZTE", 1)]


def test_min_price_ignores_missing_prices():
    [b] = brand_stats([_row("Apple 1", None), _row("Apple 2", 9_000_000.4), _row("Apple 3", 12_000_000)], _extract)
    assert b["min_price"] == 9_000_000


def test_image_from_model_sold_in_most_stores():
    [b] = brand_stats([
        _row("Samsung cheap banner", 1_000_000, "banner.jpg", stores=1),
        _row("Samsung popular", 3_000_000, "clean.jpg", stores=6),
        _row("Samsung no image", 2_000_000, None, stores=9),
    ], _extract)
    assert b["image"] == "clean.jpg"


def test_same_image_is_not_reused_across_brands():
    out = brand_stats([
        # Samsung modellari ko'proq — rasm tanlashda u birinchi
        _row("Samsung A", 1, "shared.jpg", stores=5), _row("Samsung B", 2, "s.jpg", stores=1), _row("Samsung C", 5, None),
        _row("Apple A", 3, "shared.jpg", stores=5), _row("Apple B", 4, "a.jpg", stores=2),
    ], _extract)
    assert {b["key"]: b["image"] for b in out} == {"samsung": "shared.jpg", "apple": "a.jpg"}


def test_images_are_distinct_and_capped_at_three():
    [b] = brand_stats([_row(f"Samsung {i}", 1000 + i, f"{i % 4}.jpg", stores=10 - i) for i in range(8)], _extract)
    assert b["images"][0] == b["image"] == "0.jpg"
    assert b["images"] == ["0.jpg", "1.jpg", "2.jpg"]
