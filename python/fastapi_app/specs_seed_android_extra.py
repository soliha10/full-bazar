"""Qo'lda yozilgan xususiyatlar: Xiaomi, Honor, Infinix/Tecno, Realme/vivo/Huawei/ZTE (keyin qo'shilganlar).

specs_seed.py ning bir qismi — u bo'laklarni AYNAN shu tartibda birlashtiradi.
"""

ANDROID_EXTRA: list[dict] = [
    # ── Xiaomi / Redmi / Poco ────────────────────────────────────────────────
    {
        "brand": "xiaomi", "model_key": "17t pro", "display_name": "Xiaomi 17T Pro",
        "display": "6.83\" AMOLED, 144Hz, 1440x3200", "chipset": "MediaTek Dimensity 8500-Ultra",
        "ram_options": ["12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "50MP + 50MP + 50MP (triple, periscope tele)", "selfie_camera": "32MP",
        "battery_mah": 6500, "charging": "100W wired, 50W wireless", "os": "Android 16 (HyperOS 3)",
        "body": "Aluminum frame, glass back, IP68", "release_year": 2025,
    },
    {
        "brand": "redmi", "model_key": "note 15 pro", "display_name": "Xiaomi Redmi Note 15 Pro",
        "display": "6.8\" AMOLED, 120Hz, 1220x2712", "chipset": "MediaTek Dimensity 7400-Ultra",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "200MP + 8MP + 2MP (triple)", "selfie_camera": "32MP",
        "battery_mah": 5500, "charging": "45W wired", "os": "Android 15 (HyperOS 2)",
        "body": "Aluminum frame, glass back, IP68/IP69", "release_year": 2025,
    },

    # ── Honor ────────────────────────────────────────────────────────────────
    {
        "brand": "honor", "model_key": "600 pro", "display_name": "Honor 600 Pro",
        "display": "6.7\" AMOLED, 120Hz, 1200x2664", "chipset": "Snapdragon 8s Gen 4",
        "ram_options": ["12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "200MP + 12MP (dual, periscope tele)", "selfie_camera": "50MP",
        "battery_mah": 5300, "charging": "80W wired, 50W wireless", "os": "Android 15 (MagicOS 9)",
        "body": "Aluminum frame, glass back, IP68/IP69", "release_year": 2025,
    },
    {
        "brand": "honor", "model_key": "600 lite", "display_name": "Honor 600 Lite",
        "display": "6.7\" AMOLED, 120Hz, 1200x2664", "chipset": "Snapdragon 6 Gen 1",
        "ram_options": ["8GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "16MP",
        "battery_mah": 5300, "charging": "35W wired", "os": "Android 15 (MagicOS 9)",
        "body": "Plastic frame, glass back, IP64", "release_year": 2025,
    },
    {
        "brand": "honor", "model_key": "400", "display_name": "Honor 400",
        "display": "6.55\" AMOLED, 120Hz, 1200x2664", "chipset": "Snapdragon 7 Gen 3",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "200MP + 12MP (dual)", "selfie_camera": "50MP",
        "battery_mah": 5300, "charging": "66W wired", "os": "Android 15 (MagicOS 9)",
        "body": "Aluminum frame, glass back, IP65", "release_year": 2025,
    },
    {
        "brand": "honor", "model_key": "x8b", "display_name": "Honor X8b",
        "display": "6.8\" AMOLED, 120Hz, 1200x2652", "chipset": "Snapdragon 6 Gen 1",
        "ram_options": ["8GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "16MP",
        "battery_mah": 5800, "charging": "35W wired", "os": "Android 14 (MagicOS 8)",
        "body": "Plastic frame, glass back", "release_year": 2024,
    },
    {
        "brand": "honor", "model_key": "200 lite", "display_name": "Honor 200 Lite",
        "display": "6.7\" AMOLED, 120Hz, 1200x2652", "chipset": "Snapdragon 6 Gen 1",
        "ram_options": ["8GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "16MP",
        "battery_mah": 5230, "charging": "35W wired", "os": "Android 14 (MagicOS 8)",
        "body": "Plastic frame, glass back", "release_year": 2024,
    },

    # ── Infinix / Tecno ──────────────────────────────────────────────────────
    {
        "brand": "infinix", "model_key": "note 50 pro", "display_name": "Infinix Note 50 Pro",
        "display": "6.78\" AMOLED, 120Hz, 1080x2436", "chipset": "MediaTek Dimensity 7300",
        "ram_options": ["8GB", "12GB"], "storage_options": ["256GB"],
        "main_camera": "108MP + 2MP (dual)", "selfie_camera": "32MP",
        "battery_mah": 5200, "charging": "45W wired", "os": "Android 14 (XOS)",
        "body": "Plastic frame, glass back, IP64", "release_year": 2025,
    },
    {
        "brand": "infinix", "model_key": "gt 30 pro", "display_name": "Infinix GT 30 Pro",
        "display": "6.78\" AMOLED, 144Hz, 1080x2436", "chipset": "MediaTek Dimensity 8400",
        "ram_options": ["12GB"], "storage_options": ["256GB", "512GB"],
        "main_camera": "50MP + 2MP (dual)", "selfie_camera": "32MP",
        "battery_mah": 5500, "charging": "45W wired", "os": "Android 15 (XOS)",
        "body": "Plastic frame, glass back", "release_year": 2025,
    },
    {
        "brand": "infinix", "model_key": "hot 10i", "display_name": "Infinix Hot 10i",
        "display": "6.78\" IPS LCD, 60Hz, 720x1640", "chipset": "MediaTek Helio G25",
        "ram_options": ["2GB", "4GB"], "storage_options": ["32GB", "64GB"],
        "main_camera": "13MP + AI lens (dual)", "selfie_camera": "8MP",
        "battery_mah": 6000, "charging": "10W wired", "os": "Android 10 (XOS)",
        "body": "Plastic frame and back", "release_year": 2021,
    },
    {
        "brand": "tecno", "model_key": "spark go 1", "display_name": "Tecno Spark Go 1",
        "display": "6.6\" IPS LCD, 90Hz, 720x1612", "chipset": "Unisoc T606",
        "ram_options": ["3GB", "4GB"], "storage_options": ["64GB"],
        "main_camera": "13MP (single)", "selfie_camera": "5MP",
        "battery_mah": 5000, "charging": "10W wired", "os": "Android 14 Go edition (HiOS)",
        "body": "Plastic frame and back", "release_year": 2024,
    },

    # ── Realme / vivo / Huawei / ZTE ─────────────────────────────────────────
    {
        "brand": "realme", "model_key": "c30s", "display_name": "Realme C30s",
        "display": "6.5\" IPS LCD, 60Hz, 720x1600", "chipset": "Unisoc T612",
        "ram_options": ["2GB", "3GB", "4GB"], "storage_options": ["32GB", "64GB"],
        "main_camera": "8MP (single)", "selfie_camera": "5MP",
        "battery_mah": 5000, "charging": "10W wired", "os": "Android 12 (realme UI Go)",
        "body": "Plastic frame and back", "release_year": 2022,
    },
    {
        "brand": "vivo", "model_key": "y53s", "display_name": "vivo Y53s",
        "display": "6.58\" IPS LCD, 60Hz, 1080x2408", "chipset": "MediaTek Helio G80/G85",
        "ram_options": ["8GB"], "storage_options": ["128GB"],
        "main_camera": "50MP + 2MP (dual)", "selfie_camera": "8MP",
        "battery_mah": 5000, "charging": "18W wired", "os": "Android 11 (Funtouch OS)",
        "body": "Plastic frame and back", "release_year": 2021,
    },
    {
        "brand": "huawei", "model_key": "nova y61", "display_name": "Huawei Nova Y61",
        "display": "6.5\" IPS LCD, 90Hz, 720x1600", "chipset": "MediaTek Helio G88",
        "ram_options": ["4GB", "8GB"], "storage_options": ["64GB", "128GB"],
        "main_camera": "50MP + AI lens (dual)", "selfie_camera": "8MP",
        "battery_mah": 5000, "charging": "22.5W wired", "os": "Android 12 (EMUI, no Google Play)",
        "body": "Plastic frame and back", "release_year": 2023,
    },
    {
        "brand": "zte", "model_key": "nubia v80 max", "display_name": "ZTE Nubia V80 Max",
        "display": "6.9\" IPS LCD, 120Hz, 1080x2460", "chipset": "Unisoc T7280",
        "ram_options": ["4GB", "8GB"], "storage_options": ["128GB", "256GB"],
        "main_camera": "50MP + 2MP (dual)", "selfie_camera": "8MP",
        "battery_mah": 6000, "charging": "18W wired", "os": "Android 14 (MyOS)",
        "body": "Plastic frame and back", "release_year": 2025,
    },
]
