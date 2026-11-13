"""Brendlar bo'yicha yig'ma: modellar soni, eng arzon narx, vakil rasm — sof hisob (DB siz)."""

from __future__ import annotations

from typing import Any, Callable, Iterable, Mapping

# Ko'rsatiladigan nom: "poco" -> "Poco", "zte" -> "ZTE"
MAX_IMAGES = 3

_SPECIAL = {"zte": "ZTE", "lg": "LG", "tcl": "TCL", "oneplus": "OnePlus"}


def display_name(key: str) -> str:
    return _SPECIAL.get(key, key.capitalize())


def brand_stats(rows: Iterable[Mapping[str, Any]], extract: Callable[[str], str | None]) -> list[dict]:
    """
    rows: {name, keywords, price, image, stores}. Natija modellar soni bo'yicha kamayib.

    Vakil rasm — brendning eng ko'p do'konda sotiladigan modeli (teng bo'lsa —
    arzonrog'i): bunday model rasmi odatda do'kon katalogining toza rasmi, bitta
    do'kondagi reklama bannerli rasm emas. Ikki brendda bir xil rasm chiqmaydi
    (masalan, Redmi va Xiaomi bitta modelga tushsa) — keyingi nomzod olinadi.
    """
    acc: dict[str, dict] = {}
    for r in rows:
        key = extract(f"{r.get('name') or ''} {r.get('keywords') or ''}")
        if not key:
            continue
        b = acc.setdefault(key, {"key": key, "name": display_name(key), "count": 0,
                                 "min_price": None, "image": None, "_cands": []})
        b["count"] += 1
        price = float(r["price"]) if r.get("price") else None
        if price and price > 0 and (b["min_price"] is None or price < b["min_price"]):
            b["min_price"] = price
        image = r.get("image")
        if image and price:
            b["_cands"].append((-(r.get("stores") or 0), price, image))

    out = sorted(acc.values(), key=lambda b: (-b["count"], b["key"]))
    used: set[str] = set()
    for b in out:
        cands = sorted(b.pop("_cands"))
        pick = next((c[2] for c in cands if c[2] not in used), cands[0][2] if cands else None)
        b["image"] = pick
        if pick:
            used.add(pick)
        # Bosh sahifadagi yirik plitka uchun: brendning 3 tagacha mashhur modeli rasmi (har xil)
        images = [pick] if pick else []
        for c in cands:
            if len(images) >= MAX_IMAGES:
                break
            if c[2] not in images:
                images.append(c[2])
        b["images"] = images
        if b["min_price"] is not None:
            b["min_price"] = round(b["min_price"])
    return out
