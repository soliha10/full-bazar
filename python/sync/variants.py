"""
Mahsulot ichidagi rang variantlari: har rangning o'z rasmlari va o'z takliflari.

Ilgari mahsulotning barcha e'lonlari rasmlari bitta ro'yxatga qo'shilardi —
qora telefon galereyasida ko'k va oltin rasmlar ham turardi. Endi:
  · har e'lon o'z rang oilasiga (colors.listing_color) tushadi;
  · rasmlar — e'lon sahifasidagi to'liq galereya (data/listing_images.csv),
    bo'lmasa ro'yxatdagi bitta rasm;
  · takliflar — shu rangni sotayotgan har do'konning eng arzoni.
Rangi aniqlanmagan e'lonlar alohida variant (color = None) — ularni boshqa
rangga "taxminan" qo'shish galereyani yana aralashtirardi.
"""
from __future__ import annotations

from colors import listing_color

MAX_IMAGES_PER_VARIANT = 12


def build_variants(rows: list[dict]) -> list[dict]:
    """rows: guruhning e'lonlari ({title, src, price, url, image, gallery?})."""
    buckets: dict[str | None, dict] = {}
    for r in rows:
        color = listing_color(r["title"])
        b = buckets.setdefault(color, {"images": [], "offers": {}})
        for img in (r.get("gallery") or []) or ([r["image"]] if r.get("image") else []):
            if img and img not in b["images"]:
                b["images"].append(img)
        src = r["src"].lower()
        if src not in b["offers"] or r["price"] < b["offers"][src]["price"]:
            b["offers"][src] = {"source": r["src"].capitalize(), "price": r["price"], "url": r["url"]}

    variants = []
    for color, b in buckets.items():
        offers = sorted(b["offers"].values(), key=lambda o: (o["price"], o["source"]))
        variants.append({
            "color": color,
            "images": b["images"][:MAX_IMAGES_PER_VARIANT],
            "offers": offers,
            "price": offers[0]["price"] if offers else None,
        })
    # Arzonidan qimmatiga; rangi noma'lum — oxirida. Tartib barqaror bo'lsin
    # (aks holda har sinxronizatsiya mahsulotni "o'zgargan" deb qayta yozardi)
    variants.sort(key=lambda v: (v["color"] is None, v["price"] if v["price"] is not None else 0, v["color"] or ""))
    return variants
