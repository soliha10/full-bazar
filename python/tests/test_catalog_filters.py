"""Katalog tozaligi: smartfon bo'lmagan tovarlar va "tayyorlov" narxlari.
Ishga tushirish: cd python && python -m pytest tests"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import matching as m  # noqa: E402
from sync.load import is_smartphone  # noqa: E402


def test_non_phones_are_rejected():
    for title in [
        "Радиотелефон Panasonic KX-TG2512UAM , СЕРЫЙ",
        "Statsionar telefon Panasonic KX-TS2350UAT",
        "Радиотелефон Vtech DECT CS2000, чёрный",
        "Samsung Galaxy Tab A7 Lite 3/32GB kumush rang",
        "Xiaomi Redmi Pad Pro 5G 8/256 GB Mint Green",
        "Смартфон Honor Pad X8b LTE 4/128 ГБ, Серый",
        "Адаптер питания Samsung 25W Low Standby (черный)",
        "Quvvatlash qurilmasi Samsung C-C 15W EP-T1510XBEGRU (qora)",
    ]:
        assert not is_smartphone(title), title


def test_real_phones_pass():
    for title in [
        "Смартфон Samsung Galaxy A55 5G 8/256 ГБ",
        "Xiaomi Redmi Note 14 Pro 8/256 GB 67W",
        "Apple iPhone 16 Pro Max 1TB",
        "Nokia 105 (2023) Dual SIM",
        "Телефон Novey 101 черный",
        "Tecno Spark 30C 4/128GB",
    ]:
        assert is_smartphone(title), title


def row(title, price, src="olcha"):
    return {"title": title, "price": price, "src": src}


def test_same_price_for_three_sizes_is_placeholder():
    rows = [
        row("Smartfon Apple iPhone Duo 256 GB", 24_100_000),
        row("Smartfon Apple iPhone Duo 512 GB", 24_100_000),
        row("Smartfon Apple iPhone Duo 1 TB", 24_100_000),
        row("Smartfon Apple iPhone Duo 1 TB", 46_275_000, src="alif"),
    ]
    kept, dropped = m.drop_placeholder_prices(rows)
    assert dropped == 3
    assert [r["src"] for r in kept] == ["alif"]


def test_two_sizes_same_price_is_kept():
    # Marketplace'larda ikki hajm bir narxda bo'lishi haqiqiy holat
    rows = [row("Samsung Galaxy A17 128GB", 2_999_000, "alif"),
            row("Samsung Galaxy A17 256GB", 2_999_000, "alif")]
    kept, dropped = m.drop_placeholder_prices(rows)
    assert dropped == 0 and len(kept) == 2


def test_novey_colors_merge():
    assert m.parse("Телефон Novey 101 черный").brand == "novey"
    groups = m.group_rows([{"title": "Novey 101 Black"}, {"title": "Novey 101 Blue"}])
    assert len(groups) == 1
