"""gallery: sahifadan galereya ajratish (tarmoqsiz)."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gallery import _gallery_hosts, extract_images  # noqa: E402


def test_json_ld_product_images_absolute_and_deduped():
    page = """<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product",
      "image":["/img/a.jpg","https://cdn.x.uz/b.jpg","/img/a.jpg"]}</script>"""
    assert extract_images(page, "https://shop.uz/p/1") == ["https://shop.uz/img/a.jpg", "https://cdn.x.uz/b.jpg"]


def test_graph_and_object_images_and_thumbnails_dropped():
    data = {"@graph": [{"@type": "WebPage"}, {"@type": ["Product"], "image": [
        {"url": "https://r.uz/thumbnails/200/images/p/1.webp"}, {"url": "https://r.uz/media/images/p/1.webp"}]}]}
    page = f'<script type="application/ld+json">{json.dumps(data)}</script>'
    assert extract_images(page, "https://r.uz/") == ["https://r.uz/media/images/p/1.webp"]


def test_og_image_fallback_and_empty():
    assert extract_images('<meta property="og:image" content="https://a.uz/x.png">', "https://a.uz/") == ["https://a.uz/x.png"]
    assert extract_images("<html></html>", "https://a.uz/") == []


def test_poor_hosts_detected_from_cache():
    cache = {f"https://one.uz/p/{i}": {"images": json.dumps(["x"])} for i in range(5)}
    cache["https://rich.uz/p/1"] = {"images": json.dumps(["a", "b"])}
    rich, poor = _gallery_hosts(cache)
    assert rich == {"rich.uz"} and poor == {"one.uz"}
