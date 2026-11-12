"""
CSV → PostgreSQL sinxronizatsiyasining qismlari. Kirish nuqtasi —
python/sync_csv.py (Dagster `python python/sync_csv.py` ni chaqiradi).

  load     — data/<do'kon>_products.csv larni o'qish va filtrlash
  groups   — e'lonlarni mahsulotlarga guruhlash (matching.py ustida)
  slugs    — mahsulot manzillari
  conn     — bazaga ulanish, DSN tekshiruvi, vaqt chegaralari
  guard    — yiqilgan scraper himoyasi
  aliases  — eski ID -> yangi ID
  write    — bazaga yozish
"""
