"""search_text: Elasticsearch so'rovi, hujjat va brend takliflari (tarmoqsiz)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import search_text as st  # noqa: E402


def test_transliterate():
    assert st.transliterate("Редми ноут 14") == "redmi nout 14"
    assert st.has_cyrillic("айфон") and not st.has_cyrillic("iphone 16")


def test_spoken_forms_become_synonym_rules():
    rules = st.index_body()["settings"]["analysis"]["filter"]["spoken"]["synonyms"]
    assert any(r.startswith("айфон") and r.endswith("=> iphone") for r in rules)


def test_query_adds_latin_variant_for_cyrillic():
    q = st.build_query("редми ноут", 10)
    texts = {c["multi_match"]["query"] for c in q["query"]["function_score"]["query"]["bool"]["should"]}
    assert texts == {"редми ноут", "redmi nout"}


def test_model_numbers_are_not_fuzzy():
    should = st.build_query("a55", 5)["query"]["function_score"]["query"]["bool"]["should"]
    fuzzy = [c for c in should if "fuzziness" in c["multi_match"]]
    assert fuzzy and all(c["multi_match"]["fuzziness"] == "AUTO:4,7" for c in fuzzy)


def test_product_doc():
    doc = st.product_doc({"name": "Samsung Galaxy A55 8/256 GB", "title": "Смартфон Samsung", "keywords": "x" * 9000, "stores": 3})
    assert doc["brand"] == "samsung" and doc["stores"] == 3 and len(doc["keywords"]) == 4000


def test_brand_hints():
    brands = [{"key": "samsung", "name": "Samsung"}, {"key": "apple", "name": "Apple"}, {"key": "redmi", "name": "Redmi"}]
    assert [b["key"] for b in st.brand_hints("sams", brands)] == ["samsung"]
    assert [b["key"] for b in st.brand_hints("самсунг a55", brands)] == ["samsung"]
    assert [b["key"] for b in st.brand_hints("айф", brands)] == ["apple"]
    assert [b["key"] for b in st.brand_hints("iph", brands)] == ["apple"]
    assert st.brand_hints("x", brands) == []
