"""/api/products ro'yxati uchun SQL: filtrlar, saralash va sahifalash."""

from __future__ import annotations

import asyncpg

import brands
from catalog import _get_spec_index, _norm_mem, _row_to_product

async def _query_products(
    pool: asyncpg.Pool, page: int, limit: int, search: str, market: str, brand: str, category: str,
    ram: str, storage: str, battery_min: int, min_price: int, max_price: int,
    min_rating: float, sort: str,
) -> dict:
    offset = (page - 1) * limit

    where_parts: list[str] = []
    params: list = []

    if category and category.lower() != "all":
        params.append(category)
        where_parts.append(f"p.category = ${len(params)}")

    if search:
        for token in search.lower().split():
            params.append(f"%{token}%")
            i = len(params)
            where_parts.append(f"(lower(p.name) LIKE ${i} OR lower(p.keywords) LIKE ${i})")

    if brand:
        kws = brands.keywords_for(brand)
        brand_parts = []
        for kw in kws:
            params.append(f"%{kw}%")
            i = len(params)
            brand_parts.append(f"(lower(p.name) LIKE ${i} OR lower(p.keywords) LIKE ${i})")
        where_parts.append(f"({' OR '.join(brand_parts)})")

    if market:
        markets_list = [m.strip() for m in market.split(",") if m.strip()]
        if markets_list:
            params.append(markets_list)
            i = len(params)
            where_parts.append(
                f"EXISTS (SELECT 1 FROM product_markets pm WHERE pm.product_id = p.id AND lower(pm.source) = ANY(${i}::text[]))"
            )

    # ── Xususiyat bo'yicha filtr (RAM / xotira / batareya) ────────────────────
    # product_specs mahsulotga ustun orqali emas, nomi bo'yicha bog'lanadi
    # (_match_spec_row). Shuning uchun filtrni avval xotiradagi spec ro'yxatiga
    # qo'llaymiz, so'ng mos kelgan model kalitlarini SQL ga naqsh sifatida
    # uzatamiz — bu sxemani o'zgartirishni ham, sinxronizatsiyaga bog'lanishni
    # ham talab qilmaydi.
    ram_wanted     = {_norm_mem(v) for v in ram.split(",") if v.strip()}
    storage_wanted = {_norm_mem(v) for v in storage.split(",") if v.strip()}

    if ram_wanted or storage_wanted or battery_min:
        # Model kalitini SQL da naqsh sifatida qidirib bo'lmaydi: bir modelning
        # kaliti boshqasining nomiga qism bo'lib tushadi ("iphone 15" ichida
        # "15"), brend cheklovi ham yo'qoladi. Natijada iPhone 15 "12GB RAM"
        # filtriga tushib qolardi. Shuning uchun mahsulotni xususiyatga
        # bog'lashda aynan _match_spec_row ishlatiladi — sahifadagi xususiyatlar
        # bilan bir xil natija beradigan yagona yo'l.
        spec_index = await _get_spec_index(pool)
        matched_ids = [
            pid for pid, row in spec_index.items()
            if not (ram_wanted and not ram_wanted & {_norm_mem(o) for o in (row["ram_options"] or [])})
            and not (storage_wanted and not storage_wanted & {_norm_mem(o) for o in (row["storage_options"] or [])})
            and not (battery_min and (row["battery_mah"] or 0) < battery_min)
        ]

        if not matched_ids:
            # Hech bir mahsulot mos kelmadi — bazaga bormaymiz.
            return {"products": [], "total": 0, "page": page, "limit": limit, "hasMore": False}

        params.append(matched_ids)
        where_parts.append(f"p.id = ANY(${len(params)}::text[])")

    # Narx, reyting va saralash SERVERDA. Ilgari ular mijozda faqat yuklangan
    # 20 talik sahifaga qo'llanardi: "qimmatdan arzonga" birinchi sahifani
    # saralardi xolos, narx oralig'i esa "total" ni o'zgartirmasdi va
    # cheksiz aylantirish filtrga mos kelmaydigan sahifalarni yuklayverardi.
    if min_price:
        params.append(min_price)
        where_parts.append(f"p.price >= ${len(params)}")
    if max_price:
        params.append(max_price)
        where_parts.append(f"p.price <= ${len(params)}")
    if min_rating:
        params.append(min_rating)
        where_parts.append(f"p.rating >= ${len(params)}")

    where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    # p.id — teng narxlilar orasida barqaror tartib. Usiz OFFSET sahifalari
    # orasida bir xil narxli mahsulot takrorlanishi yoki tushib qolishi mumkin.
    order_sql = {
        "price_desc": "price DESC, id",
        "rating":     "rating DESC NULLS LAST, reviews DESC NULLS LAST, price ASC, id",
    }.get(sort, "price ASC, id")

    # Bitta so'rov: sahifa, umumiy son va marketlar birga keladi.
    # Ilgari uchta alohida so'rov ketardi (COUNT, sahifa, marketlar) — bazaga
    # har borish ~300 ms bo'lgani uchun bu javobni uch barobar sekinlashtirardi.
    #   • COUNT(*) OVER()  — WHERE dan keyin, LIMIT dan oldin hisoblanadi,
    #                        ya'ni alohida COUNT so'roviga ehtiyoj qolmaydi.
    #   • LATERAL          — CTE dan keyin turgani uchun faqat qaytadigan
    #                        satrlar (≤200) uchun ishlaydi, butun jadval uchun emas.
    #   • CTE faqat id ni saralaydi. Ilgari `p.*` saralanardi — har satr bilan
    #     5 KB gacha keywords va images butun jadval bo'yicha o'qilib, xotirada
    #     tartiblanardi. Sog' bazada ham ~8 s edi, Supabase disk IO budjeti
    #     tugaganda (2026-10-24) 30 s dan oshib, 500 berardi.
    rows = await pool.fetch(
        f"""
        WITH filtered AS (
            SELECT p.id, COUNT(*) OVER() AS total_count,
                   ROW_NUMBER() OVER (ORDER BY {order_sql}) AS rn
            FROM products p
            {where_sql}
            ORDER BY {order_sql}
            LIMIT ${len(params)+1} OFFSET ${len(params)+2}
        )
        SELECT p.*, f.total_count, COALESCE(m.markets, '[]'::jsonb) AS markets_json
        FROM filtered f
        JOIN products p ON p.id = f.id
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(
                       jsonb_build_object(
                           'source',    pm.source,
                           'price',     pm.price,
                           'url',       COALESCE(pm.url, '#'),
                           'checkedAt', pm.created_at
                       ) ORDER BY pm.price
                   ) AS markets
            FROM product_markets pm
            WHERE pm.product_id = f.id
        ) m ON TRUE
        ORDER BY f.rn
        """,
        *params, limit, offset,
    )

    if rows:
        total: int = rows[0]["total_count"]
    elif page == 1:
        total = 0
    else:
        # Oxiridan nariroqdagi sahifa: satr yo'q, demak COUNT(*) OVER() ham yo'q.
        # Kamdan-kam holat, shuning uchun bu yerda qo'shimcha so'rov qilsa bo'ladi.
        total = await pool.fetchval(f"SELECT COUNT(*) FROM products p {where_sql}", *params)

    products = [_row_to_product(r, list(r["markets_json"] or [])) for r in rows]

    return {"products": products, "total": total, "page": page, "limit": limit, "hasMore": offset + limit < total}
