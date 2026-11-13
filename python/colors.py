"""
E'lon sarlavhasidan telefon rangini aniqlash.

Bir mahsulot (model + xotira) bir nechta rangda sotiladi va ilgari barcha rang
e'lonlarining rasmlari bitta galereyaga qo'shilardi: qora telefon sahifasida
ko'k va oltin rangli rasmlar ham chiqardi. Endi har e'lon o'z rang oilasiga
tegishli ("Midnight", "черный", "qora" — black) va galereya rang bo'yicha.

Rang oilasi — kalit, ekrandagi nomi tarjima fayllarida (locales/*/catalog.ts).
Baza va tarmoqqa bog'liq emas — tests/test_colors.py da sinaladi.
"""
from __future__ import annotations

import re

# Til qoidasi: qaysi so'z qaysi rang oilasiga tegishli. Ko'p so'zli nomlar
# (rose gold, deep purple) bitta so'zlilardan OLDIN tekshiriladi. "Space",
# "Phantom", "Frost" ataylab yo'q: ular rang emas, qo'shimcha (Space Black, Phantom White).
_PHRASES: dict[str, tuple[str, ...]] = {
    "gold": ("rose gold", "розовое золото", "pink gold"),
    "purple": ("deep purple",),
    "blue": ("deep blue", "sierra blue", "pacific blue", "темно-синий", "тёмно-синий", "to'q ko'k"),
    "orange": ("to'q sariq", "cosmic orange"),
    "titanium": ("natural titanium", "desert titanium", "титан", "titanium"),
}
_WORDS: dict[str, tuple[str, ...]] = {
    "black": ("black", "midnight", "night", "onyx", "obsidian", "jet", "noir", "темная ночь", "тёмная ночь",
              "черный", "чёрный", "черная", "чёрная", "qora"),
    "white": ("white", "starlight", "сияющая звезда", "pearl", "snow", "ivory", "белый", "белая", "oq", "oppoq"),
    "silver": ("silver", "серебристый", "серебряный", "серебро", "kumush"),
    "gray": ("gray", "grey", "lightgray", "light gray", "charcoal", "graphite", "slate", "серый", "серая", "графит", "kulrang"),
    "blue": ("blue", "navy", "ocean", "sky", "ice", "iceblue", "sapphire", "aqua", "cyan", "ultramarine",
             "синий", "синяя", "голубой", "голубая", "лазурный", "ko'k", "havorang", "moviy"),
    "green": ("green", "graygreen", "mint", "teal", "emerald", "jade", "olive", "sage", "lime", "lemongrass", "forest", "лайм",
              "зеленый", "зелёный", "зеленая", "мятный", "бирюзовый", "оливковый", "yashil"),
    "purple": ("purple", "violet", "lavender", "lilac", "фиолетовый", "лавандовый", "сиреневый",
               "пурпурный", "binafsha", "binafsharang", "siyohrang"),
    "pink": ("pink", "rose", "coral", "blush", "розовый", "розовая", "коралловый", "фуксия", "pushti"),
    "red": ("red", "burgundy", "crimson", "красный", "красная", "бордовый", "qizil"),
    "orange": ("orange", "оранжевый", "оранжевая"),
    "yellow": ("yellow", "lemon", "желтый", "жёлтый", "желтая", "sariq"),
    "gold": ("gold", "golden", "champagne", "золотой", "золотистый", "золото", "oltin", "tilla"),
    "brown": ("brown", "bronze", "copper", "chocolate", "коричневый", "шоколадный", "бронза", "jigarrang"),
    "beige": ("beige", "cream", "sand", "sandy", "desert", "бежевый", "кремовый", "песочный"),
}

COLOR_FAMILIES = tuple(_WORDS)


def _pattern(words: tuple[str, ...]) -> re.Pattern:
    alts = "|".join(re.escape(w) for w in sorted(words, key=len, reverse=True))
    # So'z chegarasi kirill va apostrofli o'zbek so'zlari uchun ham ishlasin
    return re.compile(rf"(?<![\w'ʼ])(?:{alts})(?![\w'ʼ])", re.I)


_RULES = [(fam, _pattern(w)) for fam, w in _PHRASES.items()] + [(fam, _pattern(w)) for fam, w in _WORDS.items()]


def listing_color(title: str) -> str | None:
    """Sarlavhadagi BIRINCHI rang oilasi; topilmasa None.

    "Смартфон ... Nano-SIM, черный, шоколадный" — birinchisi (black): do'kon
    asosiy rangni oldin yozadi. "Rose Gold" — gold, "pink" emas.
    """
    text = (title or "").lower().replace("ё", "е").replace("`", "'").replace("ʻ", "'")
    # Do'konlar ba'zan kirill so'z ichiga lotin "c" yozadi: "cиний"
    text = re.sub(r"c(?=[а-я])", "с", text)
    best: tuple[int, int, str] | None = None
    for i, (family, rx) in enumerate(_RULES):
        m = rx.search(text)
        # Eng chapdagisi; bir joyda bo'lsa — ro'yxatda oldin turgani (iborani so'zdan ustun)
        if m and (best is None or (m.start(), i) < best[:2]):
            best = (m.start(), i, family)
    return best[2] if best else None
