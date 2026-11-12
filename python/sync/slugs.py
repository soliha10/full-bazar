"""Mahsulot manzili (slug): yasash, to'qnashuvlar va bazadagi eski sluglar."""
from __future__ import annotations

import re
import unicodedata

from .conn import _apply_timeouts


# ── URL slug ─────────────────────────────────────────────────────────────────
# Mahsulot manzili faqat nomdan iborat bo'lishi kerak: /product/iphone-15-128gb
# emas, /product/iphone-15-128gb-prod-8fc7e81f5ca9. Shuning uchun slug bazada
# ustun sifatida saqlanadi va API uni ID bilan barobar qabul qiladi.
#
# frontend/src/utils/slug.ts dagi slugify BILAN BIR XIL natija berishi kerak —
# ikkalasi ham kirillchani lotinga o'giradi va 70 belgida kesadi.
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    # o'zbek kirillchasiga xos harflar
    "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}


def _slugify(text: str) -> str:
    out = []
    for ch in (text or "").lower():
        out.append(_CYRILLIC.get(ch, ch))
    value = unicodedata.normalize("NFD", "".join(out))
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    value = re.sub(r"['\u2019`]", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:70].rstrip("-")


def assign_slugs(groups, existing: dict | None = None):
    """
    Har bir guruhga takrorlanmaydigan slug beradi.

    Slug — mahsulotning ommaviy manzili, shuning uchun u BIR MARTA berilib,
    keyin o'zgarmasligi kerak. Ikkita xavf bor:

      1. Nomlar takrorlanadi (turli do'kon bir xil sarlavha yozadi, yoki rang
         nomda ko'rsatilmagan), URL esa yagona bo'lishi shart. To'qnashuvda
         ID ning qisqa bo'lagi qo'shiladi — tasodifiy tartibga bog'liq
         "-2"/"-3" qo'shimchalaridan farqli o'laroq, bu keyingi
         sinxronizatsiyada ham AYNAN o'sha slugni beradi.
      2. `title` — guruhdagi ENG UZUN do'kon sarlavhasi. Yangi do'kon undan
         ham uzun sarlavha bilan qo'shilsa, nom o'zgarib slug ham o'zgarardi
         va tarqalgan havolalar 404 bo'lardi. Shuning uchun bazada allaqachon
         slugi bor mahsulot O'SHA slugini saqlab qoladi.
    """
    existing = existing or {}
    used: set[str] = set()

    # 1) Oldin berilgan sluglar — ular hech qachon o'zgarmaydi
    for pid in sorted(groups):
        old_slug = existing.get(pid)
        if old_slug and old_slug not in used:
            groups[pid]["slug"] = old_slug
            used.add(old_slug)

    # 2) Yangi mahsulotlarga slug beramiz. ID bo'yicha tartib — natija
    #    sinxronizatsiyadan sinxronizatsiyaga barqaror.
    for pid in sorted(groups):
        g = groups[pid]
        if g.get("slug"):
            continue
        # Nom rangsiz ("samsung-galaxy-a55-5g-8-128-gb"), sarlavha esa bir
        # do'konning rangli yozuvi — slug nomdan olinadi
        base = _slugify(g["name"]) or _slugify(g["title"]) or pid
        slug = base
        if slug in used:
            suffix = pid.replace("prod-", "")[:6]
            slug = f"{base[:70 - len(suffix) - 1]}-{suffix}"
            # Nihoyatda kam uchraydi: bir xil nom + bir xil ID prefiksi
            n = 2
            while slug in used:
                slug = f"{base[:66]}-{suffix}-{n}"
                n += 1
        used.add(slug)
        g["slug"] = slug
    return groups


SLUG_DDL = (
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(200)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)",
    # _write_rows narxlarni (product_id, source) bo'yicha UPSERT qiladi
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_markets_product_source "
    "ON product_markets(product_id, source)",
)


def load_existing_slugs(conn) -> dict:
    """{product_id: slug} — oldingi sinxronizatsiyada berilgan manzillar."""
    with conn.cursor() as cur:
        _apply_timeouts(cur)
        # ALTER TABLE ... IF NOT EXISTS ham, CREATE INDEX ... IF NOT EXISTS ham
        # ustun/indeks BOR bo'lsa-da avval jadval qulfini oladi (ALTER —
        # ACCESS EXCLUSIVE). Qulf navbatida turgan buyruq orqasida saytning
        # o'qishlari ham to'xtaydi, shuning uchun faqat haqiqatan yo'q
        # bo'lganda bajaramiz.
        cur.execute("""
            SELECT
              EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'products' AND column_name = 'slug'),
              EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_slug'),
              EXISTS (SELECT 1 FROM pg_indexes
                      WHERE indexname = 'idx_product_markets_product_source')
        """)
        for stmt, present in zip(SLUG_DDL, cur.fetchone()):
            if not present:
                cur.execute(stmt)
        cur.execute("SELECT id, slug FROM products WHERE slug IS NOT NULL")
        return dict(cur.fetchall())
