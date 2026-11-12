"""matching.py qoidalari. Ishga tushirish: cd python && python -m pytest tests"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import matching as m  # noqa: E402


def key(title):
    l = m.parse(title)
    return (l.brand, l.model, l.storage)


def same(a, b):
    return key(a) == key(b)


def test_same_model_across_stores():
    # Rang, "Смартфон", SIM turi, ГБ/GB, "+" / "/" yozilishi farq qilmaydi
    assert same("Смартфон Apple iPhone 16 Pro Max 1 ТБ, Black Titanium",
                "Apple iPhone 16 Pro Max 1TB (Natural Titanium) +100 GB of Internet + 3 months of TV-COM")
    assert same("Смартфон Samsung Galaxy A55 5G 8/128 GB Purple", "Samsung Galaxy A55 8/128 GB Awesome Iceblue")
    assert same("Смартфон Xiaomi Redmi Note 14 Pro 12+512GB Ocean Blue",
                "Xiaomi Redmi Note 14 Pro 12/512GB Aurora Purple Smartfoni")
    assert same("Redmi Note 14 Pro+ 5G 8/256 Frost Blue", "Смартфон Xiaomi Redmi Note 14 Pro Plus 5G 8/256GB Purple")
    assert same("Смартфон Samsung Galaxy S25+ 12/256GB", "Samsung Galaxy S25 Plus 12/256 GB")
    assert same("Redmi A3, Midnight Black, 3/64 GB", "Xiaomi Redmi A3 3/64GB Black")
    assert same("Redmi\xa015C\xa08+256GB\xa0Moonlight\xa0Blue", "Смартфон Xiaomi Redmi 15C 8/256 ГБ, Черный")


def test_different_models_never_match():
    assert not same("Samsung Galaxy S25 12/256GB", "Samsung Galaxy S25 Plus 12/256GB")
    assert not same("Redmi Note 14 Pro 8/256", "Redmi Note 14 Pro Plus 8/256")
    assert not same("Tecno Spark 30C 8/256", "Tecno Camon 30C 8/256")
    assert not same("Infinix Hot 50 8/256", "Infinix Hot 50i 8/256")
    assert not same("Apple iPhone 16 Pro 256GB", "Apple iPhone 16 Pro Max 256GB")
    assert not same("Samsung Galaxy A55 8/128", "Samsung Galaxy A55 8/256")


def test_memory_parsing():
    l = m.parse("Смартфон Apple iPhone 16 Pro Max 1 ТБ")
    assert (l.storage, l.ram) == (1024, None)
    l = m.parse("Honor X9c 12+256")
    assert (l.storage, l.ram) == (256, 12)
    l = m.parse("Смартфон XIAOMI REDMI 15C (8/256) Moonlight Blue")
    assert (l.storage, l.ram) == (256, 8)
    assert m.parse("Смартфон Xiaomi Redmi 15C 8ГБ/256Гб").storage == 256


def test_display_name_has_no_color():
    assert m.display_name(m.parse("Смартфон Samsung Galaxy A55 5G 8/128 GB Purple")) == "Samsung Galaxy A55 5G 8/128 GB"
    assert m.display_name(m.parse("Apple iPhone 16 Pro Max 1TB Desert Titanium")) == "Apple iPhone 16 Pro Max 1 TB"


def rows(*items):
    return [{"title": t, "src": s, "price": p, "url": f"https://{s}/{i}"} for i, (t, s, p) in enumerate(items)]


def test_grouping_ram_and_unknown_storage():
    gs = m.group_rows(rows(
        ("Samsung Galaxy A55 8/128 Blue", "a", 4_000_000),
        ("Samsung Galaxy A55 128GB Navy", "b", 4_100_000),     # RAM yozilmagan — 8/128 ga qo'shiladi
        ("Samsung Galaxy A55 6/128 Lilac", "c", 3_900_000),     # boshqa RAM — alohida
        ("Samsung Galaxy A55 Lilac", "d", 4_000_000),           # hajmi yo'q, model ikki xil — alohida
    ))
    by_srcs = sorted(sorted(r["src"] for r in g.rows) for g in gs)
    assert by_srcs == [["a", "b"], ["c"], ["d"]]


def test_unsized_listing_joins_single_variant():
    gs = m.group_rows(rows(
        ("Samsung Galaxy A06 4/128 Black", "a", 1_500_000),
        ("Samsung Galaxy A06 Green", "b", 1_550_000),
    ))
    assert len(gs) == 1 and len(gs[0].rows) == 2


def test_price_outliers():
    gs, dropped = m.drop_price_outliers(m.group_rows(rows(
        ("Xiaomi 17 12/512 Black", "ozon", 1_265_524),
        ("Xiaomi 17 12/512 Pink", "alif", 11_999_000),
        ("Xiaomi 17 12/512 Black", "mi", 12_475_000),
        ("Xiaomi 17 12/512 Ice Blue", "castore", 14_567_400),
    )))
    assert dropped == 1 and sorted(r["src"] for r in gs[0].rows) == ["alif", "castore", "mi"]
    # Ikki do'kon va 2 barobardan ko'p farq — qaysi biri to'g'ri noma'lum: birlashtirilmaydi
    gs, _ = m.drop_price_outliers(m.group_rows(rows(
        ("Apple iPhone Duo 1TB White", "olcha", 24_100_000),
        ("Apple iPhone Duo 1TB Night Sky", "chakana", 88_605_000),
    )))
    assert len(gs) == 2


def test_group_ids_are_stable():
    data = rows(("Honor 400 8/256 Gold", "a", 5_000_000), ("Honor 400 8+256GB Black", "b", 5_200_000))
    assert [g.pid for g in m.group_rows(data)] == [g.pid for g in m.group_rows(list(reversed(data)))]


def test_display_name_adds_missing_brand():
    assert m.display_name(m.parse("Galaxy A55 8/128 Blue")) == "Samsung Galaxy A55 8/128 GB"
    assert m.display_name(m.parse("iPhone 13 128GB Midnight")) == "iPhone 13 128 GB"
