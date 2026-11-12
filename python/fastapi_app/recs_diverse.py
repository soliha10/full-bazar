"""
Bosh sahifadagi "eng ko'p tejaladigan modellar" ro'yxatini xilma-xil qilish.

Takliflar narx farqi bo'yicha saralanadi, shuning uchun ro'yxat tepasini
bitta modelning xotira variantlari (iPhone Duo 256/512/1 TB) va bitta brend
egallab oladi. Bu yerda: har model bir marta (eng katta farqlisi), har
brenddan ko'pi bilan `per_brand` ta. Baza va tarmoqqa bog'liq emas.
"""
from __future__ import annotations

import re

import brands

_MEMORY_RE = re.compile(r"\s+\d+\s*(?:/\s*\d+\s*)?(?:gb|tb)\b.*$", re.I)
_SERIES_RE = re.compile(r"\b(apple|iphone|samsung|galaxy|xiaomi)\b", re.I)


def model_family(name: str) -> str:
    """"Apple iPhone 18 Pro Max 2 TB" va "Apple 18 Pro Max 1 TB" -> "18 pro max"."""
    n = _MEMORY_RE.sub("", (name or "").lower())
    n = _SERIES_RE.sub("", n)
    return re.sub(r"\s+", " ", n).strip()


def diverse_pick(rows: list, limit: int, per_brand: int = 3) -> list:
    """rows — farq bo'yicha kamayish tartibida; har birida "name" va "keywords"."""
    seen: set[str] = set()
    per: dict[str, int] = {}
    out = []
    for r in rows:
        family = model_family(r["name"])
        brand = brands.extract_brand(f"{r['name'] or ''} {r.get('keywords') or ''}") or family.split(" ")[0]
        if family in seen or per.get(brand, 0) >= per_brand:
            continue
        seen.add(family)
        per[brand] = per.get(brand, 0) + 1
        out.append(r)
        if len(out) >= limit:
            break
    return out
