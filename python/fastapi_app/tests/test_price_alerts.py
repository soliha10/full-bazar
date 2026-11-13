"""Kuzatuv ro'yxatidagi narx o'zgarishi xabari: asos narx, chegara, tartib."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from price_alerts import baseline_price, price_alerts  # noqa: E402


def _row(pid, added, now, seen=None, source="Ozon"):
    return {
        "product_id": pid,
        "product_data": {"name": f"Phone {pid}", "slug": f"phone-{pid}", "image": "x.jpg", "price": added},
        "seen_price": seen,
        "now_price": now,
        "now_source": source,
    }


def test_baseline_prefers_seen_price_over_added_price():
    assert baseline_price(900, {"price": 1000}) == 900
    assert baseline_price(None, {"price": 1000}) == 1000
    assert baseline_price(None, {"price": "bad"}) is None


def test_small_changes_are_not_reported():
    assert price_alerts([_row("a", 1_000_000, 1_005_000)]) == []


def test_drop_and_rise_with_percent_and_prices():
    [alert] = price_alerts([_row("a", 1_000_000, 900_000)])
    assert alert["pct"] == -10.0
    assert (alert["old_price"], alert["new_price"]) == (1_000_000, 900_000)
    assert alert["slug"] == "phone-a" and alert["source"] == "Ozon"


def test_seen_price_resets_the_baseline():
    # Foydalanuvchi 900 000 ni ko'rgan — narx o'zgarmagan bo'lsa xabar yo'q
    assert price_alerts([_row("a", 1_000_000, 900_000, seen=900_000)]) == []


def test_missing_current_price_is_skipped():
    assert price_alerts([_row("a", 1_000_000, None)]) == []


def test_drops_first_then_by_magnitude():
    alerts = price_alerts([
        _row("rise", 100, 130),
        _row("small-drop", 100, 97),
        _row("big-drop", 100, 80),
    ])
    assert [a["id"] for a in alerts] == ["big-drop", "small-drop", "rise"]
