"""Haftalik narx o'zgarishi — "olmani olma bilan": faqat bir xil do'konlar (sof hisob, DB siz).

Ilgari hozirgi eng arzon narx BARCHA joriy do'konlardan, 7 kun oldingisi esa
o'shanda bor bo'lgan do'konlardan olinardi. Yangi arzon do'kon qo'shilsa yoki
eng arzon do'kon tovarni olib tashlasa, bu "narx tushdi/oshdi" bo'lib chiqardi —
Tahlil sahifasida ro'yxatning tepasi 36–38% lik "o'zgarishlar" bilan to'lardi.
Endi ikkala narx ham faqat 7 kun oldin HAM, hozir HAM sotayotgan do'konlardan.
"""

from __future__ import annotations

from typing import Any, Iterable, Mapping

# Bir xil do'konlarda ham bir haftada 40% dan ortiq o'zgarish deyarli har doim
# ma'lumot xatosi (e'lon boshqa variantga almashgan, aksessuar narxi)
MAX_PCT = 40.0


def weekly_changes(pairs: Iterable[Mapping[str, Any]], max_pct: float = MAX_PCT) -> list[dict]:
    """
    pairs: {product_id, old_price, now_price} — har do'kon uchun (ikkala davrda ham bor).
    Natija: {product_id, old_price, now_price, change, pct}, o'zgarmaganlar va chegaradan
    oshganlar chiqarib tashlangan.
    """
    acc: dict[str, list[float]] = {}
    for p in pairs:
        old, now = float(p["old_price"] or 0), float(p["now_price"] or 0)
        if old <= 0 or now <= 0:
            continue
        cur = acc.setdefault(p["product_id"], [old, now])
        cur[0], cur[1] = min(cur[0], old), min(cur[1], now)

    out: list[dict] = []
    for pid, (old, now) in acc.items():
        if now == old:
            continue
        pct = (now - old) / old * 100
        if abs(pct) > max_pct:
            continue
        out.append({"product_id": pid, "old_price": old, "now_price": now,
                    "change": now - old, "pct": pct})
    return out


def split_top(changes: list[dict], limit: int) -> tuple[list[dict], list[dict]]:
    """Foiz bo'yicha eng ko'p arzonlashgan va qimmatlashganlar (so'mda saralansa — faqat flagmanlar)."""
    drops = sorted((c for c in changes if c["change"] < 0), key=lambda c: c["pct"])[:limit]
    rises = sorted((c for c in changes if c["change"] > 0), key=lambda c: -c["pct"])[:limit]
    return drops, rises
