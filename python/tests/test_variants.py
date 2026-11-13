"""sync.variants: rang bo'yicha rasm va takliflar."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sync.variants import build_variants  # noqa: E402


def row(title, src, price, image, gallery=None):
    return {"title": title, "src": src, "price": price, "url": f"https://{src}.uz/{price}", "image": image, "gallery": gallery or []}


def test_images_never_mix_colors():
    rows = [
        row("Samsung Galaxy A55 8/256 черный", "alif", 5_000_000, "a-black.jpg", ["a-black-1.jpg", "a-black-2.jpg"]),
        row("Samsung Galaxy A55 8/256 Awesome Navy", "texnomart", 5_100_000, "t-navy.jpg"),
        row("Samsung Galaxy A55 8/256 qora", "olcha", 4_900_000, "o-black.jpg"),
    ]
    v = {x["color"]: x for x in build_variants(rows)}
    assert set(v) == {"black", "blue"}
    assert v["black"]["images"] == ["a-black-1.jpg", "a-black-2.jpg", "o-black.jpg"]
    assert v["blue"]["images"] == ["t-navy.jpg"]
    # Har rangning o'z takliflari, arzonidan
    assert [o["source"] for o in v["black"]["offers"]] == ["Olcha", "Alif"]
    assert v["black"]["price"] == 4_900_000


def test_order_cheapest_first_unknown_last_and_stable():
    rows = [
        row("Phone X 128GB", "a", 100, "u.jpg"),
        row("Phone X 128GB blue", "b", 300, "b.jpg"),
        row("Phone X 128GB black", "c", 200, "k.jpg"),
    ]
    assert [x["color"] for x in build_variants(rows)] == ["black", "blue", None]
    assert build_variants(rows) == build_variants(list(reversed(rows)))
