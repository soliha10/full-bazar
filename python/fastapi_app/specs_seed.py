"""
Hand-authored seed specs for the phone models most commonly seen across the
scraped store catalogs (data/*_products.csv). This is NOT scraped from any
third-party spec database — it's general public-knowledge facts (display
size, chipset, camera MP, battery capacity, etc.) written out by hand as a
starting dataset for the compare feature.

Coverage is intentionally limited to popular models. Values are best-effort
and approximate for lesser-known regional variants — treat this as a seed,
not an authoritative source. `model_key` must be a normalized (lowercase,
alnum + spaces only) substring that uniquely identifies the model within its
brand; matching picks the longest `model_key` that appears in the product's
normalized name, so more specific variants (e.g. "pro max") must be listed
before their shorter prefixes (e.g. "pro") — order in this list doesn't
matter since the matcher sorts by length itself, but keep this in mind if
you add ambiguous keys.

Ma'lumot hajmi katta bo'lgani uchun brend guruhlari bo'yicha specs_seed_*.py
fayllariga bo'lingan. API `from specs_seed import SPEC_SEED` bilan o'qiydi,
shuning uchun bu nom va ro'yxat tartibi (asl fayldagidek) shu yerda saqlanadi.
"""

from specs_seed_android import ANDROID
from specs_seed_android_extra import ANDROID_EXTRA
from specs_seed_apple import APPLE

SPEC_SEED: list[dict] = [*APPLE, *ANDROID, *ANDROID_EXTRA]
