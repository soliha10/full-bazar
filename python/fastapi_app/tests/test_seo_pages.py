"""SEO: sitemap (lastmod, rasm, brend URL), brend va mahsulot sahifasi HTML i."""

import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import seo  # noqa: E402
import seo_brand  # noqa: E402
import seo_ssr  # noqa: E402
from seo_sitemap import sitemap_xml  # noqa: E402

PAGE = (
    '<html><head><title>x</title><meta name="description" content="d" />'
    '<link rel="canonical" href="https://bazarcom.online/" />'
    '<meta property="og:title" content="t" /></head><body><div id="root"></div></body></html>'
)


def _brand(text):
    return "samsung" if "samsung" in text.lower() else ""


def _ld(html):
    return json.loads(re.search(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html).group(1))


def test_sitemap_real_lastmod_images_and_brand_urls():
    rows = [
        {"id": "p1", "slug": "galaxy-a55", "name": "Samsung Galaxy A55", "keywords": "", "image": "https://x/1.jpg",
         "lastmod": datetime(2026, 11, 10, tzinfo=timezone.utc)},
        {"id": "p2", "slug": None, "name": "Nokia 105", "keywords": "", "image": None,
         "lastmod": datetime(2026, 11, 12, tzinfo=timezone.utc)},
    ]
    xml = sitemap_xml(rows, _brand)
    assert "<loc>https://bazarcom.online/product/galaxy-a55</loc>\n    <lastmod>2026-11-10</lastmod>" in xml
    assert "<loc>https://bazarcom.online/product/p2</loc>" in xml
    assert "<image:loc>https://x/1.jpg</image:loc>" in xml
    assert "<loc>https://bazarcom.online/brand/samsung</loc>\n    <lastmod>2026-11-10</lastmod>" in xml
    # Statik sahifalar — eng yangi o'zgarish sanasi, "bugun" emas
    assert "<loc>https://bazarcom.online/</loc>\n    <lastmod>2026-11-12</lastmod>" in xml


def test_brand_page_meta_and_item_list():
    products = [{"name": "Galaxy A55", "path": "/product/galaxy-a55", "price": 3674000, "image": "https://x/1.jpg"}]
    html = seo_brand.inject_brand_meta(PAGE, "samsung", "Samsung", products, 337, 1050418, 9)
    # Minglar orasida NBSP — saytdagi Intl formati bilan bir xil (seo._fmt_price)
    assert "<title>Samsung smartfonlari narxlari — 337 model, 1\u00a0050\u00a0418 so'mdan | Bazarcom</title>" in html
    assert 'href="https://bazarcom.online/brand/samsung"' in html
    graph = _ld(html)["@graph"]
    items = graph[0]["mainEntity"]["itemListElement"]
    assert items[0]["url"] == "https://bazarcom.online/product/galaxy-a55"
    assert graph[0]["mainEntity"]["numberOfItems"] == 337


def test_product_meta_brand_and_sellers():
    product = {"id": "p1", "name": "Samsung Galaxy A55 8/128 GB", "price": 3000000, "image": "https://x/1.jpg",
               "images": ["https://x/1.jpg", "https://x/2.jpg"],
               "markets": [{"source": "Ozon", "price": 3200000, "url": "https://ozon/a"},
                           {"source": "Glotr", "price": 3000000, "url": "https://glotr/a"}]}
    html = seo.inject_product_meta(PAGE, product, "/product/galaxy-a55", brand_name="Samsung", brand_key="samsung")
    graph = _ld(html)["@graph"]
    prod, crumbs = graph[0], graph[1]["itemListElement"]
    assert prod["brand"] == {"@type": "Brand", "name": "Samsung"}
    assert prod["image"] == ["https://x/1.jpg", "https://x/2.jpg"]
    assert [o["seller"]["name"] for o in prod["offers"]["offers"]] == ["Glotr", "Ozon"]
    assert [c["name"] for c in crumbs] == ["Bosh sahifa", "Smartfonlar", "Samsung", product["name"]]


def test_ssr_body_is_escaped_and_injected():
    body = seo_ssr.product_body({"name": "<b>Phone</b>", "markets": [
        {"source": "Ozon", "price": 2000, "url": "https://o"}, {"source": "Glotr", "price": 1000}]},
        ("samsung", "Samsung"))
    assert "&lt;b&gt;Phone&lt;/b&gt;" in body and "<b>Phone</b>" not in body
    assert body.index("Glotr") < body.index("Ozon")  # narx bo'yicha
    assert 'href="/brand/samsung"' in body
    page = seo_ssr.inject_root(PAGE, body)
    assert '<div id="root"><main' in page
