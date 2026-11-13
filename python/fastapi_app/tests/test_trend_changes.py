"""Haftalik narx o'zgarishi: faqat bir xil do'konlar, chegara, tartib."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from trend_changes import split_top, weekly_changes  # noqa: E402


def _p(pid, old, now):
    return {"product_id": pid, "old_price": old, "now_price": now}


def test_min_over_the_same_stores():
    # Ikkala do'kon ham ikkala davrda bor: 100→90 va 120→80 — eng arzon 100→80
    [c] = weekly_changes([_p("a", 100, 90), _p("a", 120, 80)])
    assert (c["old_price"], c["now_price"]) == (100, 80)
    assert round(c["pct"], 1) == -20.0


def test_new_cheap_store_is_not_a_price_drop():
    # Yangi arzon do'kon juftlik bermaydi (7 kun oldin yo'q edi) — o'zgarish yo'q
    assert weekly_changes([_p("a", 100, 100)]) == []


def test_outliers_and_bad_prices_are_skipped():
    assert weekly_changes([_p("a", 1_694_910, 24_749_494)]) == []  # +1360%
    assert weekly_changes([_p("b", 0, 100), _p("c", 100, None)]) == []


def test_split_top_by_percent():
    changes = weekly_changes([_p("big", 1000, 700), _p("small", 100, 95), _p("up", 100, 120)])
    drops, rises = split_top(changes, limit=5)
    assert [c["product_id"] for c in drops] == ["big", "small"]
    assert [c["product_id"] for c in rises] == ["up"]
