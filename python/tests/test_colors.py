"""colors.listing_color: sarlavhadan rang oilasi."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from colors import listing_color  # noqa: E402


def test_languages_map_to_one_family():
    assert listing_color("Смартфон Samsung Galaxy A55 8/256 ГБ, черный") == "black"
    assert listing_color("Apple iPhone 16 128GB Midnight") == "black"
    assert listing_color("Samsung Galaxy A17 4/128 qora") == "black"
    assert listing_color("Redmi Note 14 ko'k 8/256") == "blue"
    assert listing_color("Смартфон Xiaomi 14T 12/512 ГБ, тёмно-синий") == "blue"


def test_marketing_prefixes_do_not_fool():
    assert listing_color("Apple iPhone 15 Pro Max Space Black") == "black"
    assert listing_color("Samsung Galaxy S23 Phantom White") == "white"
    assert listing_color("iPhone 16 Pro Desert Titanium 256GB") == "titanium"
    assert listing_color("Apple iPhone 8 Rose Gold") == "gold"


def test_first_color_wins_and_missing_is_none():
    assert listing_color("Смартфон Redmi 8/256 ГБ, Nano-SIM, черный, шоколадный") == "black"
    assert listing_color("Samsung Galaxy A55 8/256") is None
    # So'z ichidagi tasodif rang emas: "Oqtepa" / "Redmi" dagi "red"
    assert listing_color("Redmi Note 13 Pro 8/256") is None


def test_more_names():
    assert listing_color("Samsung Galaxy A57 5G 8/256 ГБ, Awesome Lightgray") == "gray"
    assert listing_color("Samsung Galaxy A34 5G 8/128 Gb Лайм") == "green"
    assert listing_color("Xiaomi Redmi 15 6/128GB (Binafsharang)") == "purple"
    assert listing_color("Apple iPhone 14 256GB E-SIM Темная ночь") == "black"
    assert listing_color("Кнопочный телефон Novey Z320, cиний") == "blue"
