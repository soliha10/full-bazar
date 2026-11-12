"""Qo'lda yozilgan xususiyatlar: Samsung, Xiaomi, Honor, Huawei/Tecno/Infinix.

specs_seed.py ning bir qismi — u bo'laklarni AYNAN shu tartibda birlashtiradi.
"""

ANDROID: list[dict] = [
    # ── Samsung ──────────────────────────────────────────────────────────────
    {
        "brand": "samsung", "model_key": "galaxy s25 ultra", "display_name": "Samsung Galaxy S25 Ultra",
        "display": "6.9\" LTPO AMOLED, 120Hz, 1440x3120", "chipset": "Snapdragon 8 Elite for Galaxy",
        "ram_options": ["12GB"], "storage_options": ["256GB", "512GB", "1TB"],
        "main_camera": "200MP + 50MP + 50MP + 10MP (quad, S Pen)", "selfie_camera": "12MP",
        "battery_mah": 5000, "charging": "45W wired, 15W wireless", "os": "Android 15 (One UI 7)",
        "body": "Titanium frame, glass back, IP68", "release_year": 2025,
    },
    {
        "brand": "samsung", "model_key": "galaxy s24 fe", "display_name": "Samsung Galaxy S24 FE",
        "display": "6.7\" AMOLED, 120Hz, 1080x2340", "chipset": "Exynos 2400e / Snapdragon 8 Gen 2",
        "ram_options": ["8GB"], "storage_options": ["128GB", "256GB", "512GB"],
        "main_camera": "50MP + 12MP + 8MP (triple)", "selfie_camera": "10MP",
        "battery_mah": 4700, "charging": "25W wired, 15W wireless", "os": "Android 14 (One UI 6)",
        "body": "Aluminum frame, glass back, IP68", "release_year": 2024,
    },
    {
        "brand": "samsung", "model_key": "galaxy a36", "display_name": "Samsung Galaxy A36",
        "display": "6.7\" AMOLED, 120Hz, 1080x2340", "chipset": "Snapdragon 6 Gen 3 / Exynos 1380",
        "ram_options": ["8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 8MP + 5MP (triple)", "selfie_camera": "13MP",
        "battery_mah": 5000, "charging": "25W wired", "os": "Android 15 (One UI 7)",
        "body": "Plastic frame, glass back, IP67", "release_year": 2025,
    },

    # ── Xiaomi / Redmi / Poco ────────────────────────────────────────────────
    {
        "brand": "redmi", "model_key": "note 14 pro", "display_name": "Xiaomi Redmi Note 14 Pro+",
        "display": "6.67\" AMOLED, 120Hz, 1220x2712", "chipset": "MediaTek Dimensity 7300-Ultra",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "200MP + 8MP + 2MP (triple, OIS)", "selfie_camera": "20MP",
        "battery_mah": 5110, "charging": "120W wired", "os": "Android 14 (HyperOS)",
        "body": "Aluminum frame, glass back, IP68/IP69", "release_year": 2024,
    },
    {
        "brand": "redmi", "model_key": "note 15", "display_name": "Xiaomi Redmi Note 15",
        "display": "6.7\" AMOLED, 120Hz, 1220x2712", "chipset": "Snapdragon 6s Gen 3 / Dimensity 6300",
        "ram_options": ["6GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 8MP + 2MP (triple)", "selfie_camera": "13MP",
        "battery_mah": 6000, "charging": "33W wired", "os": "Android 15 (HyperOS 2)",
        "body": "Plastic frame, glass back, IP66/68/69", "release_year": 2025,
    },
    {
        "brand": "redmi", "model_key": "15c", "display_name": "Xiaomi Redmi 15C",
        "display": "6.9\" IPS LCD, 120Hz, 720x1600", "chipset": "MediaTek Helio G81-Ultra",
        "ram_options": ["4GB", "6GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + AI lens (dual)", "selfie_camera": "8MP",
        "battery_mah": 6000, "charging": "18W wired", "os": "Android 15 (HyperOS 2)",
        "body": "Plastic frame and back", "release_year": 2025,
    },
    {
        "brand": "redmi", "model_key": "15", "display_name": "Xiaomi Redmi 15",
        "display": "6.9\" IPS LCD, 120Hz, 720x1600", "chipset": "Snapdragon 6s Gen 3",
        "ram_options": ["6GB", "8GB", "12GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 2MP (dual)", "selfie_camera": "8MP",
        "battery_mah": 7000, "charging": "33W wired", "os": "Android 15 (HyperOS 2)",
        "body": "Plastic frame and back, IP64", "release_year": 2025,
    },
    {
        "brand": "xiaomi", "model_key": "14t pro", "display_name": "Xiaomi 14T Pro",
        "display": "6.67\" AMOLED, 144Hz, 1220x2712", "chipset": "MediaTek Dimensity 8300-Ultra",
        "ram_options": ["12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "50MP + 50MP + 12MP (triple, Leica)", "selfie_camera": "32MP",
        "battery_mah": 5000, "charging": "120W wired", "os": "Android 14 (HyperOS)",
        "body": "Aluminum frame, glass back, IP68", "release_year": 2024,
    },
    {
        "brand": "xiaomi", "model_key": "14t", "display_name": "Xiaomi 14T",
        "display": "6.67\" AMOLED, 144Hz, 1220x2712", "chipset": "MediaTek Dimensity 8300-Ultra",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "50MP + 50MP + 12MP (triple, Leica)", "selfie_camera": "32MP",
        "battery_mah": 5000, "charging": "67W wired", "os": "Android 14 (HyperOS)",
        "body": "Aluminum frame, glass back, IP68", "release_year": 2024,
    },
    {
        "brand": "poco", "model_key": "x7", "display_name": "Poco X7",
        "display": "6.67\" AMOLED, 120Hz, 1220x2712", "chipset": "MediaTek Dimensity 7300-Ultra",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "50MP + 8MP + 2MP (triple)", "selfie_camera": "20MP",
        "battery_mah": 5110, "charging": "45W wired", "os": "Android 14 (HyperOS)",
        "body": "Aluminum frame, glass back, IP68/IP69", "release_year": 2025,
    },

    # ── Honor (continued) ────────────────────────────────────────────────────
    {
        "brand": "honor", "model_key": "x8d", "display_name": "Honor X8d",
        "display": "6.8\" AMOLED, 120Hz, 1200x2652", "chipset": "Snapdragon 6s Gen 3",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "16MP",
        "battery_mah": 6000, "charging": "35W wired", "os": "Android 15 (MagicOS 9)",
        "body": "Plastic frame, glass back, IP64", "release_year": 2025,
    },
    {
        "brand": "honor", "model_key": "x7d", "display_name": "Honor X7d",
        "display": "6.78\" LCD, 120Hz, 1200x2652", "chipset": "Snapdragon 6 Gen 1",
        "ram_options": ["6GB", "8GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "8MP",
        "battery_mah": 6000, "charging": "35W wired", "os": "Android 14 (MagicOS 8)",
        "body": "Plastic frame and back", "release_year": 2025,
    },
    {
        "brand": "honor", "model_key": "x9d", "display_name": "Honor X9d",
        "display": "6.78\" AMOLED, 120Hz, curved, 1200x2652", "chipset": "Snapdragon 6 Gen 1",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "108MP + 2MP (dual, OIS)", "selfie_camera": "16MP",
        "battery_mah": 5800, "charging": "66W wired", "os": "Android 14 (MagicOS 8)",
        "body": "Plastic frame, glass back, drop-resistant, IP65", "release_year": 2025,
    },

    # ── Huawei / Tecno / Infinix (continued) ────────────────────────────────
    {
        "brand": "huawei", "model_key": "p60 pro", "display_name": "Huawei P60 Pro",
        "display": "6.67\" LTPO OLED, 120Hz, 1220x2700", "chipset": "Snapdragon 8+ Gen 1 (4G only)",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "48MP + 48MP + 13MP (triple, variable aperture)", "selfie_camera": "13MP",
        "battery_mah": 4815, "charging": "88W wired, 50W wireless",
        "os": "HarmonyOS / EMUI (no Google Play)", "body": "Glass/ceramic back, IP68", "release_year": 2023,
    },
    {
        "brand": "tecno", "model_key": "spark 30c", "display_name": "Tecno Spark 30C",
        "display": "6.67\" LCD, 120Hz, 720x1612", "chipset": "Unisoc T7250",
        "ram_options": ["6GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "48MP + AI lens (dual)", "selfie_camera": "8MP",
        "battery_mah": 5000, "charging": "18W wired", "os": "Android 14 (HiOS)",
        "body": "Plastic frame and back", "release_year": 2025,
    },
    {
        "brand": "infinix", "model_key": "smart 9", "display_name": "Infinix Smart 9",
        "display": "6.6\" LCD, 90Hz, 720x1612", "chipset": "Unisoc T7250",
        "ram_options": ["3GB", "4GB"], "storage_options": ["64GB", "128GB"],
        "main_camera": "13MP + AI lens (dual)", "selfie_camera": "5MP",
        "battery_mah": 5000, "charging": "10W wired", "os": "Android 14 Go edition (XOS)",
        "body": "Plastic frame and back", "release_year": 2025,
    },
    {
        "brand": "samsung", "model_key": "galaxy s21 fe", "display_name": "Samsung Galaxy S21 FE",
        "display": "6.4\" AMOLED, 120Hz, 1080x2340", "chipset": "Exynos 2100 / Snapdragon 888",
        "ram_options": ["6GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "12MP + 12MP + 8MP (triple)", "selfie_camera": "32MP",
        "battery_mah": 4500, "charging": "25W wired, 15W wireless", "os": "Android (One UI, upgradable)",
        "body": "Aluminum frame, plastic/glass back, IP68", "release_year": 2022,
    },
    {
        "brand": "samsung", "model_key": "galaxy a71", "display_name": "Samsung Galaxy A71",
        "display": "6.7\" AMOLED, 60Hz, 1080x2400", "chipset": "Snapdragon 730",
        "ram_options": ["6GB", "8GB"], "storage_options": ["128GB"],
        "main_camera": "64MP + 12MP + 5MP + 5MP (quad)", "selfie_camera": "32MP",
        "battery_mah": 4500, "charging": "25W wired", "os": "Android (One UI)",
        "body": "Plastic frame and back", "release_year": 2020,
    },
    {
        "brand": "samsung", "model_key": "galaxy a37", "display_name": "Samsung Galaxy A37",
        "display": "6.7\" PLS LCD, 90Hz, 1080x2400", "chipset": "Exynos 1380 / MediaTek Dimensity 6300",
        "ram_options": ["6GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 5MP (dual)", "selfie_camera": "13MP",
        "battery_mah": 5000, "charging": "25W wired", "os": "Android 15 (One UI 7)",
        "body": "Plastic frame and back, IP54", "release_year": 2025,
    },
    {
        "brand": "samsung", "model_key": "galaxy a17", "display_name": "Samsung Galaxy A17",
        "display": "6.7\" PLS LCD, 90Hz, 1080x2340", "chipset": "MediaTek Dimensity 6300 / Helio G99",
        "ram_options": ["4GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 5MP + 2MP (triple)", "selfie_camera": "13MP",
        "battery_mah": 5000, "charging": "25W wired", "os": "Android 15 (One UI 7)",
        "body": "Plastic frame and back, IP54", "release_year": 2025,
    },
]
