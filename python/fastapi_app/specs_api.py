"""Mahsulot xususiyatlari va solishtirish yo'llari."""

from __future__ import annotations

import json

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request

from catalog import _fetch_markets, _find_product, _get_specs, _match_spec_row, _row_to_product
from compare_verdict import _compare_verdict
from spec_payload import _spec_payload

router = APIRouter()


# ── Specs & compare ────────────────────────────────────────────────────────────

_SPEC_DIFF_FIELDS = [
    "display", "chipset", "ramOptions", "storageOptions", "mainCamera",
    "selfieCamera", "batteryMah", "charging", "os", "body", "releaseYear",
]


@router.get("/api/products/{product_ref}/specs")
async def get_product_specs(request: Request, product_ref: str) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    row = await _find_product(pool, product_ref)
    if row is None:
        raise HTTPException(status_code=404, detail="Not Found")
    _, spec_index = await _get_specs(pool)
    spec = _match_spec_row(row["name"] or "", row["keywords"] or "", spec_index)
    return {"matched": spec is not None, "specs": _spec_payload(spec, row["name"] or "") if spec else None}


@router.get("/api/compare")
async def compare_products(request: Request, ids: str = Query(..., min_length=1)) -> dict:
    pool: asyncpg.Pool = request.app.state.pool
    refs = [i.strip() for i in ids.split(",") if i.strip()][:4]
    if not refs:
        raise HTTPException(status_code=400, detail="No product ids given")

    # Solishtirishga slug bilan ham, ID bilan ham murojaat qilinadi.
    rows = list(await pool.fetch(
        "SELECT * FROM products WHERE id = ANY($1::text[]) OR slug = ANY($1::text[])",
        refs,
    ))
    by_ref: dict[str, asyncpg.Record] = {}
    for r in rows:
        by_ref[r["id"]] = r
        if r["slug"]:
            by_ref[r["slug"]] = r
    # Brauzerda saqlangan solishtirish ro'yxatida eski ID lar bo'lishi mumkin —
    # guruhlash o'zgargach ular product_aliases orqali yangisiga ochiladi
    for ref in refs:
        if ref not in by_ref:
            row = await _find_product(pool, ref)
            if row is not None:
                by_ref[ref] = row
                rows.append(row)
    if not rows:
        raise HTTPException(status_code=404, detail="Not Found")

    markets_map = await _fetch_markets(pool, [r["id"] for r in rows])
    _, spec_index = await _get_specs(pool)

    items = []
    seen: set[str] = set()
    for ref in refs:
        row = by_ref.get(ref)
        if row is None or row["id"] in seen:
            continue
        seen.add(row["id"])
        spec = _match_spec_row(row["name"] or "", row["keywords"] or "", spec_index)
        items.append({
            "product": _row_to_product(row, markets_map.get(row["id"], [])),
            "specs": _spec_payload(spec, row["name"] or "") if spec else None,
        })

    diff_fields = [
        field for field in _SPEC_DIFF_FIELDS
        if len({json.dumps((it["specs"] or {}).get(field)) for it in items}) > 1
    ]
    return {
        "items": items,
        "diffFields": diff_fields,
        "verdict": _compare_verdict(items),
    }
