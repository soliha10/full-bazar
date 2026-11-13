"""Kuzatilayotgan mahsulotlar narxi o'zgarishi — sof hisob (DB siz, testlanadi).

Asos narx — foydalanuvchi oxirgi marta KO'RGAN narx (user_watchlist.seen_price).
U yo'q bo'lsa (ustun qo'shilishidan oldingi yozuvlar) — kuzatuvga qo'shilgan
paytdagi narx (product_data.price). Asos narx ko'rilgach yangilanadi, shuning
uchun bitta o'zgarish har kirishda qayta-qayta chiqmaydi.
"""

from __future__ import annotations

from typing import Any, Iterable, Mapping

# Undan kichik tebranish xabar qilinmaydi — kuzatuv sahifasidagi chegara bilan bir xil
MIN_CHANGE_PCT = 1.0


def _num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n > 0 else None


def baseline_price(seen_price: Any, product_data: Mapping[str, Any] | None) -> float | None:
    """Foydalanuvchi ko'rgan narx; bo'lmasa — qo'shilgan paytdagi narx."""
    return _num(seen_price) or _num((product_data or {}).get("price"))


def price_alerts(rows: Iterable[Mapping[str, Any]], min_pct: float = MIN_CHANGE_PCT) -> list[dict]:
    """
    rows: {product_id, product_data, seen_price, now_price, now_source}.
    Natija: asos narxdan kamida min_pct % o'zgarganlar, o'zgarish kattaligi bo'yicha.
    """
    out: list[dict] = []
    for r in rows:
        data = dict(r.get("product_data") or {})
        old = baseline_price(r.get("seen_price"), data)
        new = _num(r.get("now_price"))
        if old is None or new is None:
            continue
        pct = (new - old) / old * 100
        if abs(pct) < min_pct:
            continue
        out.append({
            "id": r["product_id"],
            "slug": data.get("slug"),
            "name": data.get("name") or data.get("title") or "",
            "image": data.get("image"),
            "old_price": round(old),
            "new_price": round(new),
            "pct": round(pct, 1),
            "source": r.get("now_source"),
        })
    # Avval arzonlashganlar (foydalanuvchi uchun eng foydali xabar), keyin kattalik bo'yicha
    out.sort(key=lambda a: (a["pct"] > 0, -abs(a["pct"])))
    return out
