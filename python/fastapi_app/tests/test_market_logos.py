"""market_logos: bosh sahifadagi ikonkalarni tanlash (tarmoqsiz)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import market_logos as ml  # noqa: E402


def test_icon_links_biggest_first_and_absolute():
    html = """<head>
      <link rel="icon" href="/favicon-32.png" sizes="32x32">
      <link rel="apple-touch-icon" href="/apple-180.png">
      <link rel="icon" type="image/png" href="https://cdn.x.uz/icon-512.png" sizes="512x512">
      <link rel="stylesheet" href="/app.css">
    </head>"""
    links = ml._icon_links(html, "https://shop.uz/")
    assert [u for _, u in links] == [
        "https://cdn.x.uz/icon-512.png", "https://shop.uz/apple-180.png", "https://shop.uz/favicon-32.png",
    ]


def test_host_regex_strips_path():
    assert ml._HOST_RE.match("https://www.olcha.uz/ru/product/1").group(1) == "www.olcha.uz"
