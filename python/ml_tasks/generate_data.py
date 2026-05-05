import pandas as pd
import random
import os

def generate_synthetic_data(num_samples=10000):
    """
    Generates synthetic product matching data for training the ML model.
    Covers all brands present in real scraped data.
    """
    brands = {
        "Apple": [
            "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 15 Plus",
            "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14", "iPhone 14 Plus",
            "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
            "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
            "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11", "iPhone SE 3",
        ],
        "Samsung": [
            "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
            "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23 FE", "Galaxy S23",
            "Galaxy S22 Ultra", "Galaxy S22", "Galaxy S21 FE",
            "Galaxy A55 5G", "Galaxy A54 5G", "Galaxy A35 5G", "Galaxy A34",
            "Galaxy A25", "Galaxy A15", "Galaxy A14", "Galaxy A05s", "Galaxy A05",
            "Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Flip 5", "Galaxy Z Flip 4",
            "Galaxy M34 5G", "Galaxy M14", "Galaxy F14 5G",
        ],
        "Redmi": [
            "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 13 4G",
            "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12",
            "Redmi Note 11 Pro", "Redmi Note 11S", "Redmi Note 11",
            "Redmi 13C", "Redmi 13", "Redmi 12", "Redmi 12C",
            "Redmi A2+", "Redmi A3", "Redmi K70 Pro", "Redmi K60",
        ],
        "Xiaomi": [
            "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 14", "Xiaomi 14T Pro", "Xiaomi 14T",
            "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13T Pro", "Xiaomi 13T", "Xiaomi 13",
            "Xiaomi 12T Pro", "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 12X",
            "Xiaomi 11T Pro", "Xiaomi 11T", "Xiaomi 11 Ultra",
            "Poco X6 Pro", "Poco X6", "Poco X5 Pro", "Poco X5",
            "Poco M6 Pro", "Poco M5s", "Poco M5", "Poco F5 Pro", "Poco F5",
        ],
        "Honor": [
            "Honor 200 Pro", "Honor 200", "Honor 100 Pro", "Honor 100",
            "Honor 90 Pro", "Honor 90", "Honor 90 Lite", "Honor 80 Pro",
            "Honor X9b", "Honor X9a", "Honor X8b", "Honor X8a", "Honor X7b", "Honor X7a",
            "Honor Magic6 Pro", "Honor Magic5 Lite", "Honor Magic5 Pro",
        ],
        "Vivo": [
            "Vivo V30 Pro", "Vivo V30", "Vivo V30e",
            "Vivo V29 Pro", "Vivo V29", "Vivo V27 Pro", "Vivo V27",
            "Vivo Y200 Pro", "Vivo Y200", "Vivo Y100",
            "Vivo X100 Pro", "Vivo X100", "Vivo X90 Pro",
            "Vivo Y36", "Vivo Y35", "Vivo Y22s",
        ],
        "Oppo": [
            "Oppo Find X7 Ultra", "Oppo Find X7", "Oppo Find X6 Pro",
            "Oppo Reno 12 Pro", "Oppo Reno 12", "Oppo Reno 11 Pro", "Oppo Reno 11",
            "Oppo Reno 10 Pro+", "Oppo Reno 10 Pro", "Oppo Reno 10",
            "Oppo A79 5G", "Oppo A78", "Oppo A58", "Oppo A38", "Oppo A17",
        ],
        "Realme": [
            "Realme GT 5 Pro", "Realme GT 5", "Realme GT Neo 5 SE",
            "Realme 12 Pro+", "Realme 12 Pro", "Realme 12", "Realme 12+",
            "Realme 11 Pro+", "Realme 11 Pro", "Realme 11",
            "Realme C67", "Realme C65", "Realme C55", "Realme C53", "Realme C33",
            "Realme Note 50", "Realme 9 Pro+",
        ],
        "Tecno": [
            "Tecno Camon 30 Pro", "Tecno Camon 30", "Tecno Camon 20 Pro",
            "Tecno Spark 20 Pro+", "Tecno Spark 20 Pro", "Tecno Spark 20", "Tecno Spark 10",
            "Tecno Pova 6 Pro", "Tecno Pova 6", "Tecno Pova 5 Pro", "Tecno Pova 5",
            "Tecno Phantom X2 Pro", "Tecno Phantom V Fold", "Tecno Pop 8",
        ],
        "Infinix": [
            "Infinix Zero 30 5G", "Infinix Zero 30", "Infinix Zero 20",
            "Infinix Note 40 Pro", "Infinix Note 40", "Infinix Note 30 Pro", "Infinix Note 30",
            "Infinix Hot 40 Pro", "Infinix Hot 40", "Infinix Hot 30 Play",
            "Infinix Smart 8 Plus", "Infinix Smart 8 Pro", "Infinix Smart 8",
        ],
    }

    colors = [
        "Black", "White", "Blue", "Green", "Silver", "Gold", "Purple",
        "Midnight", "Titanium", "Natural", "Coral", "Cream", "Lavender",
        "Graphite", "Starlight", "Deep Purple",
    ]
    storages = ["64GB", "128GB", "256GB", "512GB", "1TB"]
    memories = ["3GB", "4GB", "6GB", "8GB", "12GB", "16GB"]

    variations = [
        lambda name, b, c, s, m: f"{b} {name} {s} {c}",
        lambda name, b, c, s, m: f"{name} {s} ({c})",
        lambda name, b, c, s, m: f"{b} {name} {m}/{s} {c}",
        lambda name, b, c, s, m: f"Смартфон {b} {name} {s} {c}",
        lambda name, b, c, s, m: f"Smartfon {b} {name} {s} {c}",
        lambda name, b, c, s, m: f"{b} {name} {c} {s}",
        lambda name, b, c, s, m: f"{name} {s} {c}",
        lambda name, b, c, s, m: f"{b} {name}",
        lambda name, b, c, s, m: f"{name} {s} - {c}",
        lambda name, b, c, s, m: f"{b} {name} {m}+{s}",
        lambda name, b, c, s, m: f"Smartfon {name} {s}/{m} {c}",
    ]

    data = []

    for _ in range(num_samples):
        is_match = random.choice([0, 1])
        brand = random.choice(list(brands.keys()))

        if is_match:
            base_product = random.choice(brands[brand])
            color = random.choice(colors)
            storage = random.choice(storages)
            memory = random.choice(memories)

            var1 = random.choice(variations)
            var2 = random.choice(variations)

            name_a = var1(base_product, brand, color, storage, memory)
            name_b = var2(base_product, brand, color, storage, memory)
        else:
            base_product_1 = random.choice(brands[brand])
            base_product_2 = random.choice(brands[brand])
            color1, color2 = random.sample(colors, 2)
            storage1, storage2 = random.sample(storages, 2)
            memory = random.choice(memories)

            var1 = random.choice(variations)
            var2 = random.choice(variations)

            r = random.random()
            if r < 0.35:
                # Same model, different storage → NOT a match
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_1, brand, color2, storage2, memory)
            elif r < 0.70:
                # Different model, same brand → NOT a match
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_2, brand, color1, storage1, memory)
            else:
                # Completely different brand → NOT a match
                brand2 = random.choice([b for b in brands if b != brand])
                base_product_3 = random.choice(brands[brand2])
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_3, brand2, color2, storage2, memory)

        data.append({
            "name_a": name_a.strip(),
            "name_b": name_b.strip(),
            "is_match": is_match,
        })

    df = pd.DataFrame(data)
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/synthetic_matching_data.csv", index=False)
    print(f"✅ Generated {num_samples} synthetic matching pairs → data/synthetic_matching_data.csv")


if __name__ == "__main__":
    generate_synthetic_data(10000)
