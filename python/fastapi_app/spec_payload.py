"""/specs va /compare javobidagi xususiyatlar — baza va tarmoqsiz, sinaladi."""

from __future__ import annotations

import re


# Mahsulot nomining oxiridagi xotira: "... 8/128 GB", "... 1 TB"
_OWN_MEMORY = re.compile(r"(?:(\d+)\s*/\s*)?(\d+)\s*(GB|TB)\s*$", re.I)


def _own_memory(name: str) -> tuple[str | None, str | None]:
    """(ram, storage) — mahsulotning O'Z konfiguratsiyasi, nomidan."""
    m = _OWN_MEMORY.search(name or "")
    if not m:
        return None, None
    return (f"{m.group(1)}GB" if m.group(1) else None), f"{m.group(2)}{m.group(3).upper()}"


def _spec_payload(row: dict, product_name: str = "") -> dict:
    # Mahsulot = model + xotira, shuning uchun xotira modelning variantlari
    # ro'yxati emas, shu mahsulotniki. GSMArena ro'yxat sarlavhasidan olingan
    # qiymatlar (tafsilotsiz yozuv) faqat ENG KATTA konfiguratsiya — "128 GB"
    # li mahsulotda "512GB" chiqardi. Tafsilotsiz yozuvning RAM i ham shunday.
    own_ram, own_storage = _own_memory(product_name)
    detailed = bool(row["main_camera"] or row["os"] or row["body"])
    ram = [own_ram] if own_ram else (list(row["ram_options"] or []) if detailed else [])
    storage = [own_storage] if own_storage else (list(row["storage_options"] or []) if detailed else [])
    return {
        "displayName":    row["display_name"],
        "display":        row["display"],
        "chipset":        row["chipset"],
        "ramOptions":     ram,
        "storageOptions": storage,
        "mainCamera":     row["main_camera"],
        "selfieCamera":   row["selfie_camera"],
        "batteryMah":     row["battery_mah"],
        "charging":       row["charging"],
        "os":             row["os"],
        "body":           row["body"],
        "releaseYear":    row["release_year"],
    }
