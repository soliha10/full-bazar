"""E'lonlarni mahsulotlarga guruhlash (qoidalarning o'zi python/matching.py da)."""
from __future__ import annotations

import re

import matching

from .variants import build_variants


def _norm(title):
    n = title.lower()
    n = re.sub(r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|phone|[сc]\s*мартфон|smartfoni|телефон)\s+", "", n, flags=re.IGNORECASE)
    n = re.sub(r"[.,\/#!$%\^&\*;:{}=\-_`~()]", " ", n)
    return re.sub(r"\s+", " ", n).strip() or title.lower().strip()


def _display(title):
    n = re.sub(r"^[\/\s\-]*(смартфон|smartfon|smarton|telefon|cmartfon|cmartfonlar|smartfonlar|[сc]\s*мартфон)\s+", "", title, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", n).strip()


def build_groups(rows):
    """
    E'lonlarni mahsulotlarga guruhlaydi: brend + model + xotira, rang — variant
    (qoidalar python/matching.py da, sinovlari tests/test_matching.py da).

    Ilgari butun sarlavha kosinus o'xshashligi bilan solishtirilar va har bir
    rang alohida mahsulot edi: 2026-11-12 da e'lonlarning atigi 13% i bir
    nechta do'konda bor mahsulotga tushardi, yangi qoidalar bilan ~72%.
    """
    # Natija qatorlar tartibiga bog'liq bo'lmasin (rasm/sarlavha birinchidan
    # olinadi) — aks holda har sinxronizatsiya mahsulotlarni "o'zgargan" deb
    # qayta yozardi.
    rows = sorted(rows, key=lambda r: (_norm(r["title"]), r["src"], r["price"],
                                       r["url"], r["image"], r["title"]))
    rows, placeholders = matching.drop_placeholder_prices(rows)
    if placeholders:
        print(f"[sync] bir nechta xotira variantiga bir xil narx: {placeholders} ta "
              f"taklif chiqarildi (do'kon narxi hali qo'yilmagan)", flush=True)
    clustered, dropped = matching.drop_price_outliers(matching.group_rows(rows))
    if dropped:
        print(f"[sync] narxi g'ayritabiiy {dropped} ta taklif chiqarildi "
              f"(guruh medianasidan {matching.OUTLIER_FACTOR:g} barobar farq)", flush=True)

    groups = {}
    for cl in clustered:
        if not cl.rows:
            continue
        pid = cl.pid
        first = cl.rows[0]
        rating = None
        if first["rating"]:
            try:
                r = float(first["rating"])
                if 1 <= r <= 5:
                    rating = round(r, 2)
            except (ValueError, TypeError):
                pass
        reviews = None
        if first["reviews"]:
            try:
                reviews = int(first["reviews"])
            except (ValueError, TypeError):
                pass
        g = groups[pid] = {
            "id": pid,
            # Rangsiz, toza nom: "Samsung Galaxy A55 5G 8/128 GB"
            "name": matching.display_name(cl.best_listing()) or _display(first["title"]),
            "title": first["title"], "rating": rating, "reviews": reviews,
            "image": first["image"], "images": [], "keywords": set(), "markets": {},
            # Har bir do'kon sahifasi — eski mahsulot ID sini topish uchun (aliaslar)
            "members": set(),
        }
        for row in cl.rows:
            if len(row["title"]) > len(g["title"]):
                g["title"] = row["title"]
            g["keywords"].add(row["title"].lower())
            if row["image"] and row["image"] not in g["images"]:
                g["images"].append(row["image"])
            if row["image"] and not g["image"]:
                g["image"] = row["image"]
            g["members"].add((row["src"].lower(), row["url"]))
            src, price = row["src"], row["price"]
            if src not in g["markets"] or price < g["markets"][src]["price"]:
                g["markets"][src] = {"source": src.capitalize(), "price": price, "url": row["url"]}
    for cl in clustered:
        if cl.rows and cl.pid in groups:
            g = groups[cl.pid]
            g["variants"] = build_variants(cl.rows)
            # Umumiy galereya — variantlar ketma-ketligida (arzon rangdan), asosiy
            # rasm — eng arzon rangning birinchisi: kartada ham to'g'ri rang
            # (noma'lum rang ro'yxat oxirida, lekin u ham eng arzon bo'lishi mumkin)
            priced = [v for v in g["variants"] if v["price"] is not None and v["images"]]
            cheapest = min(priced, key=lambda v: v["price"]) if priced else None
            ordered = [img for v in g["variants"] for img in v["images"]]
            g["images"] = list(dict.fromkeys(ordered + g["images"]))
            if cheapest:
                g["image"] = cheapest["images"][0]
            elif ordered:
                g["image"] = ordered[0]
    for g in groups.values():
        # Takroriy sarlavhalar keywords ni 5 KB gacha shishirardi
        g["keywords"] = " ".join(sorted(g["keywords"]))
    return groups
