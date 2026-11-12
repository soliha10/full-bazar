"""Solishtirish xulosasi: xususiyat ballari, eng arzon variant va tavsiya."""

from __future__ import annotations

import re

# ── Solishtirish xulosasi (tavsiya) ──────────────────────────────────────────
# Solishtirish jadvali o'z-o'zidan javob bermaydi: foydalanuvchi 10 ta qatorni
# o'qib chiqib, "xo'sh, qaysinisini olay va qayerdan?" degan savol bilan qoladi.
# Quyidagi hisob shu savolga aniq javob beradi — qaysi model kuchli, qaysi biri
# arzon va eng arzoni qaysi do'konlarda bor.

_MP_RE       = re.compile(r"(\d+(?:\.\d+)?)\s*MP", re.I)
_HZ_RE       = re.compile(r"(\d+)\s*Hz", re.I)
_WATT_RE     = re.compile(r"(\d+(?:\.\d+)?)\s*W\b", re.I)
_CAPACITY_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(TB|GB|MB)", re.I)


def _max_capacity_gb(options: list[str] | None) -> float:
    """["128GB", "1TB"] -> 1024.0"""
    best = 0.0
    for item in options or []:
        m = _CAPACITY_RE.search(str(item))
        if not m:
            continue
        value = float(m.group(1))
        unit = m.group(2).upper()
        gb = value * (1024 if unit == "TB" else 1 if unit == "GB" else 1 / 1024)
        best = max(best, gb)
    return best


def _first_number(pattern: re.Pattern, text: str | None) -> float:
    m = pattern.search(text or "")
    return float(m.group(1)) if m else 0.0


# (kalit, sarlavha, og'irlik) — og'irliklar telefon tanlashda odatda qanchalik
# muhimligiga qarab qo'yilgan, yig'indisi 1.0 bo'lishi shart emas.
_SPEC_METRICS: tuple[tuple[str, str, float], ...] = (
    ("batteryMah",  "Batareya",     1.0),
    ("ramGb",       "RAM",          0.9),
    ("storageGb",   "Xotira",       0.7),
    ("mainCameraMp", "Asosiy kamera", 0.9),
    ("selfieCameraMp", "Old kamera", 0.4),
    ("displayHz",   "Ekran chastotasi", 0.6),
    ("chargingW",   "Zaryadlash quvvati", 0.5),
    ("releaseYear", "Yangiligi",    0.8),
)

_METRIC_UNITS = {
    "batteryMah": "mAh", "ramGb": "GB", "storageGb": "GB",
    "mainCameraMp": "MP", "selfieCameraMp": "MP", "displayHz": "Hz",
    "chargingW": "W", "releaseYear": "",
}


def _spec_metrics(specs: dict | None) -> dict[str, float]:
    """Xususiyatlardan solishtirsa bo'ladigan sonlarni ajratadi."""
    if not specs:
        return {}
    return {
        "batteryMah":      float(specs.get("batteryMah") or 0),
        "ramGb":           _max_capacity_gb(specs.get("ramOptions")),
        "storageGb":       _max_capacity_gb(specs.get("storageOptions")),
        "mainCameraMp":    _first_number(_MP_RE, specs.get("mainCamera")),
        "selfieCameraMp":  _first_number(_MP_RE, specs.get("selfieCamera")),
        "displayHz":       _first_number(_HZ_RE, specs.get("display")),
        "chargingW":       _first_number(_WATT_RE, specs.get("charging")),
        "releaseYear":     float(specs.get("releaseYear") or 0),
    }


def _compare_verdict(items: list[dict]) -> dict | None:
    """
    Solishtirilgan mahsulotlar bo'yicha xulosa:
      · har bir xususiyat bo'yicha g'olib
      · eng arzon variant va u qaysi do'konlarda bor
      · umumiy tavsiya (xususiyat ballari + narx muvozanati)
    """
    if len(items) < 2:
        return None

    metrics = [_spec_metrics(it.get("specs")) for it in items]
    prices = [float(it["product"].get("price") or 0) for it in items]

    # ── Har bir o'lchov bo'yicha g'olib va normallashtirilgan ball ───────────
    winners: dict[str, dict] = {}
    spec_scores = [0.0] * len(items)
    weight_used = 0.0

    for key, label, weight in _SPEC_METRICS:
        values = [m.get(key, 0.0) for m in metrics]
        present = [v for v in values if v > 0]
        # Hamma qiymat bir xil bo'lsa g'olib ham, ball ham yo'q — bu qator
        # tanlovga ta'sir qilmaydi.
        if len(present) < 2 or len(set(present)) < 2:
            continue

        hi, lo = max(values), min(present)
        weight_used += weight
        for i, value in enumerate(values):
            if value > 0 and hi > lo:
                spec_scores[i] += weight * (value - lo) / (hi - lo)

        best_i = max(range(len(values)), key=lambda i: values[i])
        unit = _METRIC_UNITS.get(key, "")
        winners[key] = {
            "productId": items[best_i]["product"]["id"],
            "label": label,
            "value": f"{values[best_i]:g}{(' ' + unit) if unit else ''}".strip(),
        }

    if weight_used > 0:
        spec_scores = [round(100 * v / weight_used) for v in spec_scores]
    else:
        spec_scores = [0] * len(items)

    # ── Narx ballari: eng arzoni 100 ────────────────────────────────────────
    valid_prices = [p for p in prices if p > 0]
    lo_price = min(valid_prices) if valid_prices else 0
    hi_price = max(valid_prices) if valid_prices else 0
    price_scores = []
    for p in prices:
        if p <= 0 or hi_price == lo_price:
            price_scores.append(100 if p > 0 else 0)
        else:
            price_scores.append(round(100 * (hi_price - p) / (hi_price - lo_price)))

    # ── Eng arzon variant va u mavjud do'konlar ─────────────────────────────
    cheapest = None
    if valid_prices:
        idx = min(
            (i for i, p in enumerate(prices) if p > 0),
            key=lambda i: prices[i],
        )
        product = items[idx]["product"]
        markets = sorted(product.get("markets") or [], key=lambda m: m["price"])
        cheapest = {
            "productId": product["id"],
            "slug": product.get("slug"),
            "name": product["name"],
            "price": prices[idx],
            # Eng arzon narx qaysi do'konda — "qayerdan olay?" degan savolga javob
            "bestMarket": markets[0] if markets else None,
            "markets": markets,
            "marketCount": len(markets),
            # Eng qimmat taklifga nisbatan tejaladigan summa
            "maxSaving": (markets[-1]["price"] - markets[0]["price"]) if len(markets) > 1 else 0,
            "vsMostExpensive": round(hi_price - prices[idx]) if hi_price > prices[idx] else 0,
        }

    # ── Umumiy tavsiya ──────────────────────────────────────────────────────
    # 60% xususiyat, 40% narx: solishtirish sahifasiga kirgan odam eng arzonni
    # emas, "puliga arziydiganini" qidiradi.
    overall = [round(0.6 * spec_scores[i] + 0.4 * price_scores[i]) for i in range(len(items))]
    best_i = max(range(len(items)), key=lambda i: overall[i])
    best_id = items[best_i]["product"]["id"]

    reasons: list[str] = []
    won = [w["label"] for w in winners.values() if w["productId"] == best_id]
    if won:
        reasons.append(", ".join(won[:3]) + " bo'yicha eng yaxshisi")
    if cheapest and cheapest["productId"] == best_id:
        reasons.append("solishtirilganlar orasida eng arzoni")
    elif prices[best_i] > 0 and lo_price > 0 and prices[best_i] > lo_price:
        reasons.append(f"eng arzonidan {round(prices[best_i] - lo_price):,} so'm qimmat"
                       .replace(",", " "))
    if not reasons:
        reasons.append("narx va xususiyatlar muvozanati bo'yicha oldinda")

    return {
        "scores": [
            {
                "productId": items[i]["product"]["id"],
                "specScore": spec_scores[i],
                "priceScore": price_scores[i],
                "overall": overall[i],
            }
            for i in range(len(items))
        ],
        "winners": winners,
        "cheapest": cheapest,
        "recommended": {"productId": best_id, "reasons": reasons},
    }
