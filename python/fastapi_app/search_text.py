"""
Elasticsearch uchun sof mantiq: indeks sozlamalari, hujjat va so'rov.
Baza va tarmoqqa bog'liq emas — tests/test_search_text.py da sinaladi.

Qidiruv nimalarni ko'tarishi kerak:
  · imlo xatosi       — "samsng a55", "iphne 16"    (fuzziness AUTO)
  · chala so'z        — "sams", "redmi no"           (search_as_you_type)
  · kirill / ovoz     — "айфон 16", "самсунг"         (sinonimlar + transliteratsiya)
  · xotira yozilishi  — "128gb", "128 гб", "8/256"   (char_filter)
"""
from __future__ import annotations

import re

import brands

INDEX_ALIAS = "products"

# Ovozli qidiruv va rus tilidagi yozuv: brend va seriya so'zlarining aytilishi.
# Bu katalog ma'lumoti emas, til qoidasi — qaysi so'z qaysi lotin so'ziga teng.
SPOKEN_FORMS: dict[str, tuple[str, ...]] = {
    "iphone": ("айфон", "айфоне", "aйфон", "ayfon", "aifon"),
    "apple": ("эпл", "эппл", "епл"),
    "samsung": ("самсунг", "samsun", "самсунк"),
    "galaxy": ("галакси", "гэлакси", "galaksi"),
    "xiaomi": ("сяоми", "ксиоми", "ксяоми", "shaomi", "syaomi", "ksiomi"),
    "redmi": ("редми",),
    "poco": ("поко",),
    "honor": ("хонор", "хонр"),
    "huawei": ("хуавей", "хуавэй", "xuavey"),
    "tecno": ("техно", "текно", "texno"),
    "infinix": ("инфиникс",),
    "realme": ("реалми", "риалми"),
    "vivo": ("виво",),
    "oppo": ("оппо",),
    "nokia": ("нокиа", "нокия"),
    "google": ("гугл",),
    "pixel": ("пиксель", "piksel"),
    "motorola": ("моторола",),
    "oneplus": ("ванплас", "уанплас"),
    "pro": ("про",),
    "max": ("макс",),
    "ultra": ("ультра",),
    "plus": ("плюс", "plyus"),
    "lite": ("лайт",),
    "note": ("ноут", "нот", "nout"),
    "fold": ("фолд",),
    "flip": ("флип",),
    "mini": ("мини",),
}

_CYR = dict(zip(
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяўқғҳ",
    ["a", "b", "v", "g", "d", "e", "yo", "j", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r",
     "s", "t", "u", "f", "x", "ts", "ch", "sh", "sh", "", "i", "", "e", "yu", "ya", "o", "q", "g", "h"],
))
_CYR_RE = re.compile("[а-яёўқғҳ]", re.I)


def transliterate(text: str) -> str:
    """Kirill harflarini lotinga: "редми ноут 14" -> "redmi nout 14"."""
    return "".join(_CYR.get(ch, ch) for ch in (text or "").lower())


def has_cyrillic(text: str) -> bool:
    return bool(_CYR_RE.search(text or ""))


def _synonym_rules() -> list[str]:
    return [f"{', '.join(forms)} => {canonical}" for canonical, forms in SPOKEN_FORMS.items()]


# So'rovga ham, hujjatga ham ma'no qo'shmaydigan so'zlar: tur nomi va xotira
# birligi. "Samsung A55 256 GB" va "samsung a55 256" bir xil tokenlarga aylanadi.
_STOPWORDS = ["smartfon", "smartfoni", "смартфон", "смартфона", "telefon", "телефон",
              "phone", "smartphone", "mobile", "gb", "tb"]


def index_body() -> dict:
    """Indeks sozlamalari va maydonlar."""
    char_filters = ["units", "split_units", "plus"]
    filters = ["lowercase", "asciifolding", "generic"]
    return {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "char_filter": {
                    # "128 ГБ" / "1тб" -> "128 gb" / "1 tb"
                    "units": {"type": "mapping", "mappings": ["гб => gb", "ГБ => gb", "Гб => gb",
                                                              "тб => tb", "ТБ => tb", "Тб => tb"]},
                    # "256gb" -> "256 gb": son alohida token bo'lsin
                    "split_units": {"type": "pattern_replace", "pattern": "(?i)(\\d)(gb|tb)",
                                    "replacement": "$1 $2"},
                    # "S25+" -> "S25 plus" (do'konlar ikkalasini ham yozadi)
                    "plus": {"type": "pattern_replace", "pattern": "\\+", "replacement": " plus "},
                },
                "filter": {
                    "generic": {"type": "stop", "stopwords": _STOPWORDS},
                    "spoken": {"type": "synonym_graph", "synonyms": _synonym_rules()},
                },
                "analyzer": {
                    "phone": {"type": "custom", "tokenizer": "standard",
                              "char_filter": char_filters, "filter": filters},
                    "phone_search": {"type": "custom", "tokenizer": "standard",
                                     "char_filter": char_filters, "filter": filters + ["spoken"]},
                },
            },
        },
        "mappings": {
            "properties": {
                "name": {"type": "search_as_you_type", "analyzer": "phone", "search_analyzer": "phone_search"},
                "title": {"type": "text", "analyzer": "phone", "search_analyzer": "phone_search"},
                "keywords": {"type": "text", "analyzer": "phone", "search_analyzer": "phone_search"},
                "brand": {"type": "keyword"},
                "stores": {"type": "integer"},
            },
        },
    }


def product_doc(row: dict) -> dict:
    """Bazadagi mahsulot satridan indeks hujjati."""
    name = row.get("name") or ""
    keywords = row.get("keywords") or ""
    return {
        "name": name,
        "title": row.get("title") or "",
        # Do'konlarning asl sarlavhalari (ruscha ham) — 5 KB gacha, qisqartiramiz
        "keywords": keywords[:4000],
        "brand": brands.extract_brand(f"{name} {keywords}") or None,
        "stores": int(row.get("stores") or 0),
    }


def build_query(q: str, size: int) -> dict:
    """
    Ikki qatlam: to'liq so'zlar (imlo xatosiga chidamli, hammasi mos kelishi
    shart) va yozilayotgan oxirgi so'z (prefiks). Kirill so'rovning lotin
    transliteratsiyasi ham qidiriladi. Ko'proq do'konda bor model biroz yuqori.
    """
    variants = [q]
    if has_cyrillic(q):
        variants.append(transliterate(q))
    should: list[dict] = []
    for text in variants:
        should += [
            # Aniq moslik eng yuqori: "a55" so'ralganda A55 A57 dan oldin turadi
            {"multi_match": {"query": text, "fields": ["name^8", "title^3", "keywords"],
                             "operator": "and"}},
            # Imlo xatosi: 4 harfdan qisqa so'z (a55, 16, s25) aniq bo'lishi shart —
            # model raqamini "tuzatib" boshqa modelga olib ketmasin
            {"multi_match": {"query": text, "fields": ["name^4", "title^2", "keywords"],
                             "fuzziness": "AUTO:4,7", "prefix_length": 1, "operator": "and"}},
            # Yozilayotgan oxirgi so'z — prefiks; oldingilarida imlo xatosi mumkin ("samsng a5")
            {"multi_match": {"query": text, "type": "bool_prefix", "operator": "and",
                             "fuzziness": "AUTO:4,7", "prefix_length": 1,
                             "fields": ["name^3", "name._2gram", "name._3gram"]}},
        ]
    return {
        "size": size,
        "_source": False,
        "query": {
            "function_score": {
                "query": {"bool": {"should": should, "minimum_should_match": 1}},
                "field_value_factor": {"field": "stores", "modifier": "log2p", "missing": 0},
                "boost_mode": "multiply",
            },
        },
    }


def brand_hints(q: str, brand_list: list[dict]) -> list[dict]:
    """Brend nomi so'rovning birinchi so'zi bilan boshlansa — "sam", "самс", "айф"."""
    word = q.split(" ")[0]
    if len(word) < 2:
        return []
    heads = {word, transliterate(word)} if has_cyrillic(word) else {word}
    heads |= {canon for canon, forms in SPOKEN_FORMS.items() if any(f.startswith(word) for f in forms)}
    # "iphone" brend emas, Apple ning seriyasi
    heads |= {"apple"} if any("iphone".startswith(h) and len(h) >= 2 for h in heads) else set()
    return [b for b in brand_list if any(b["key"].startswith(h) for h in heads)][:3]
