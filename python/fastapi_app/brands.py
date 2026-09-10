"""
Brend aniqlash va model kalitini moslashtirish — YAGONA manba.

Ilgari bu jadval uch joyda (main.py, sync_specs.py, scrapers/gsmarena.py)
qo'lda takrorlanardi va "tartib ham bir xil bo'lishi SHART" degan izoh bilan
kelardi. Amalda ular bir-biridan uzoqlashib, GSMArena dan yig'ilgan
xususiyatlar mahsulotga ulanmay qolardi.

Fayl ataylab `fastapi_app` ichida turadi: Render `rootDir: python/fastapi_app`
bilan deploy qiladi, ya'ni API faqat shu papkadagi modullarni ko'ra oladi.
Scraper va sync skriptlari uni `sys.path` ga `python/fastapi_app` ni qo'shib
chaqiradi (scrapers/gsmarena.py va sync_specs.py boshidagi importga qarang).
"""
from __future__ import annotations

import re

# Tartib MUHIM: aniqrog'i (sub-brend) oldinroq turadi. "Xiaomi Redmi Note 15"
# nomida ikkala so'z ham bor — do'konlar sarlavhasida sub-brend ancha barqaror.
BRAND_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("apple",    ("iphone", "apple")),
    ("samsung",  ("samsung", "galaxy")),
    ("redmi",    ("redmi",)),
    ("poco",     ("poco",)),
    # DIQQAT: bu yerga "mi " qo'shmang. Brend filtri kalitni SQL LIKE
    # naqshiga aylantiradi va '%mi %' "redmi note", "xiaomi ..." ni ham
    # tutib, Xiaomi filtriga butun Redmi ro'yxatini olib kirardi.
    ("xiaomi",   ("xiaomi",)),
    ("honor",    ("honor",)),
    ("huawei",   ("huawei", "nova y", "mate ")),
    ("vivo",     ("vivo",)),
    ("oppo",     ("oppo",)),
    ("realme",   ("realme",)),
    ("tecno",    ("tecno", "camon", "spark", "pova")),
    ("infinix",  ("infinix",)),
    ("itel",     ("itel",)),
    ("zte",      ("zte", "nubia")),
    ("nokia",    ("nokia",)),
    ("motorola", ("motorola", "moto ", "moto g", "moto e")),
    ("google",   ("google pixel", "pixel ")),
    ("oneplus",  ("oneplus", "one plus")),
    ("asus",     ("asus", "zenfone", "rog phone")),
    ("lenovo",   ("lenovo",)),
    ("meizu",    ("meizu",)),
    ("sony",     ("sony", "xperia")),
    ("lg",       ("lg ",)),
    ("tcl",      ("tcl",)),
    ("alcatel",  ("alcatel",)),
    ("blackview", ("blackview",)),
    ("ulefone",  ("ulefone",)),
    ("umidigi",  ("umidigi",)),
    ("doogee",   ("doogee",)),
    ("cubot",    ("cubot",)),
    ("oukitel",  ("oukitel",)),
    ("philips",  ("philips",)),
    ("nothing",  ("nothing phone",)),
)

# GSMArena ishlab chiqaruvchi sahifasi bitta brend ostida bir nechta
# sub-brendni ko'rsatadi (Xiaomi sahifasida Redmi va Poco, ZTE da nubia).
# Model nomiga qarab to'g'ri brendga ajratamiz.
SUB_BRAND_PARENTS: dict[str, tuple[str, ...]] = {
    "xiaomi": ("redmi", "poco"),
    "zte":    ("nubia",),
}

_NORM_RE = re.compile(r"[^a-z0-9]+")


def normalize(text: str) -> str:
    """Sarlavhani solishtirish uchun bir xil ko'rinishga keltiradi."""
    return " ".join(_NORM_RE.sub(" ", (text or "").lower()).split())


def extract_brand(text: str) -> str:
    """Matndan brendni topadi; topilmasa bo'sh satr."""
    # Bo'sh joy bilan tugaydigan kalitlar ("mi ", "lg ") uchun matn oxirida ham
    # chegara bo'lishi kerak — aks holda "Mi" bilan tugagan nom o'tkazib
    # yuborilardi.
    haystack = f" {(text or '').lower()} "
    for canonical, keywords in BRAND_KEYWORDS:
        if any(kw in haystack for kw in keywords):
            return canonical
    return ""


def brand_from_maker(maker: str, model_name: str) -> str:
    """
    GSMArena ishlab chiqaruvchi nomi + model nomidan brendni aniqlaydi.
    Xiaomi sahifasidagi "Redmi Note 15" -> "redmi", "14T Pro" -> "xiaomi".
    """
    maker_key = normalize(maker).replace(" ", "")
    model_low = f" {(model_name or '').lower()} "
    for parent, subs in SUB_BRAND_PARENTS.items():
        if maker_key.startswith(parent):
            for sub in subs:
                if sub in model_low:
                    return sub
            return parent
    return maker_key or extract_brand(model_name)


def model_key(model_name: str) -> str:
    """Xususiyat yozuvining kalitini yasaydi ("Galaxy A07s" -> "galaxy a07s")."""
    return normalize(model_name)


def key_matches(key: str, normalized_title: str) -> bool:
    """
    `key` normallashtirilgan sarlavhada TO'LIQ so'zlar ketma-ketligi sifatida
    uchraydimi?

    Oddiy `in` tekshiruvi yetarli emas: "galaxy a1" kaliti "galaxy a17 4 128"
    ichiga tushib ketadi va telefon butunlay boshqa modelning xususiyatlarini
    ko'rsatadi. Shuning uchun kalitning ikkala chekkasida ham so'z chegarasi
    talab qilinadi.
    """
    if not key:
        return False
    start = 0
    while True:
        idx = normalized_title.find(key, start)
        if idx == -1:
            return False
        before_ok = idx == 0 or normalized_title[idx - 1] == " "
        end = idx + len(key)
        after_ok = end == len(normalized_title) or normalized_title[end] == " "
        if before_ok and after_ok:
            return True
        start = idx + 1


class SpecIndex:
    """
    (brend, model_kaliti) -> xususiyatlar yozuvi ko'rinishidagi indeks.

    Nega kerak: GSMArena dan endi ~15 000 model keladi. Har bir mahsulot uchun
    shu ro'yxatni to'liq aylanib chiqish (avvalgi mantiq shunday edi) 3 000 ta
    mahsulotga 45 million taqqoslash degani — /api/products dagi xususiyat
    filtri shu sababli sekinlashib ketardi.

    Indeks bilan moslashtirish sarlavhadagi so'z ketma-ketliklarini (n-gramma)
    lug'atdan qidirishga aylanadi: uzunidan kaltasiga qarab boriladi, ya'ni
    natija avvalgi "eng uzun mos kelgan kalit yutadi" qoidasi bilan bir xil.
    """

    __slots__ = ("by_key", "max_words")

    def __init__(self, rows: list[dict]):
        self.by_key: dict[tuple[str, str], dict] = {}
        self.max_words = 1
        for row in rows:
            key = row.get("model_key") or ""
            brand = row.get("brand") or ""
            if not key or not brand:
                continue
            self.by_key.setdefault((brand, key), row)
            words = key.count(" ") + 1
            if words > self.max_words:
                self.max_words = words

    def __len__(self) -> int:
        return len(self.by_key)

    def lookup(self, brand: str, text: str) -> dict | None:
        """Normallashtirilgan matndan eng uzun mos model kalitini topadi."""
        tokens = text.split()
        if not tokens:
            return None
        for size in range(min(self.max_words, len(tokens)), 0, -1):
            for i in range(len(tokens) - size + 1):
                row = self.by_key.get((brand, " ".join(tokens[i:i + size])))
                if row is not None:
                    return row
        return None


def build_spec_index(rows: list[dict]) -> SpecIndex:
    return SpecIndex(rows)


# Kalit so'zlar ustuni har bir do'konning sarlavhasini yig'ib boradi va
# 5 000 belgigacha yetadi. Uni to'liq skanerlash foyda bermaydi — model nomi
# boshida turadi — shuning uchun zaxira qidiruv qisqartirilgan matnda ketadi.
_KEYWORDS_SCAN_LIMIT = 600


def match_spec_row(name: str, keywords: str, index: "SpecIndex | list[dict]") -> dict | None:
    """
    Do'konning tartibsiz sarlavhasini xususiyatlar yozuviga bog'laydi.

    `index` — build_spec_index() natijasi. Qulaylik uchun oddiy ro'yxat ham
    qabul qilinadi (u holda indeks shu yerda tuziladi).
    """
    if not isinstance(index, SpecIndex):
        index = SpecIndex(index)

    brand = extract_brand(f"{name or ''} {keywords or ''}")
    if not brand:
        return None

    # Avval mahsulot nomi — u qisqa va deyarli har doim yetarli.
    row = index.lookup(brand, normalize(name))
    if row is not None:
        return row

    if keywords:
        return index.lookup(brand, normalize(keywords[:_KEYWORDS_SCAN_LIMIT]))
    return None


def keywords_for(brand: str) -> list[str]:
    """
    Filtr uchun brend kalit so'zlari. Noma'lum brend kelsa uning o'z nomi
    ishlatiladi — filtr baribir ishlashi kerak.

    Kalitdagi bo'sh joy ataylab saqlanadi: "lg " -> SQL LIKE '%lg %', aks holda
    naqsh tasodifiy so'zlar ichiga tushib ketadi.
    """
    key = (brand or "").strip().lower()
    for canonical, keywords in BRAND_KEYWORDS:
        if canonical == key:
            return list(keywords)
    return [key] if key else []
