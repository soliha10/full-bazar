import pandas as pd
import random
import os

def generate_synthetic_data(num_samples=20000):
    """
    Generates synthetic product matching data for training the ML model.
    Focuses on Apple, Samsung, and Redmi (Xiaomi) as requested.
    """
    brands = {
        "Apple": [
            "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 15 Plus",
            "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14", 
            "iPhone 13", "iPhone 13 mini", "iPhone 12", "iPhone 11",
            "MacBook Pro M3", "MacBook Air M2", "iPad Pro 12.9", "AirPods Pro 2"
        ],
        "Samsung": [
            "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
            "Galaxy S23 Ultra", "Galaxy S23 FE", "Galaxy S23",
            "Galaxy A54 5G", "Galaxy A34", "Galaxy A14", "Galaxy A05s",
            "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy Tab S9"
        ],
        "Redmi": [
            "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
            "Redmi Note 12 Pro", "Redmi Note 12", "Redmi 12", "Redmi 13C",
            "Redmi K70 Pro", "Redmi K60", "Redmi Note 11S", "Redmi 10 2022"
        ],
        "Xiaomi": [
            "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13T Pro", "Xiaomi 13T",
            "Xiaomi Pad 6", "Mi Band 8", "Xiaomi Watch S3"
        ]
    }

    colors = ["Black", "White", "Blue", "Green", "Silver", "Graphite", "Gold", "Midnight", "Purple", "Titanium Grey", "Natural Titanium"]
    storages = ["64GB", "128GB", "256GB", "512GB", "1TB"]
    memories = ["4GB", "6GB", "8GB", "12GB", "16GB"]
    
    variations = [
        lambda name, b, c, s, m: f"{b} {name} {s} {c}",
        lambda name, b, c, s, m: f"{name} {s} ({c})",
        lambda name, b, c, s, m: f"{b} {name} {m}/{s} {c}",
        lambda name, b, c, s, m: f"Смартфон {b} {name} {s} {c}",
        lambda name, b, c, s, m: f"Smartfon {b} {name} {s} {c}",
        lambda name, b, c, s, m: f"{b} {name} {c} {s}",
        lambda name, b, c, s, m: f"{name} {s} {c} {b}",
        lambda name, b, c, s, m: f"{b} {name}",
        lambda name, b, c, s, m: f"{name} {s} - {c}"
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
            
            # Same model but different storage
            if random.random() < 0.4:
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_1, brand, color2, storage2, memory)
            # Different model same brand
            elif random.random() < 0.8:
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_2, brand, color1, storage1, memory)
            # Completely different
            else:
                brand2 = random.choice(list(brands.keys()))
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_2, brand2, color2, storage2, memory)
                
        data.append({
            "name_a": name_a.strip(),
            "name_b": name_b.strip(),
            "is_match": is_match
        })

    df = pd.DataFrame(data)
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/synthetic_matching_data.csv", index=False)
    print(f"✅ Generated {num_samples} synthetic matching pairs at data/synthetic_matching_data.csv")

if __name__ == "__main__":
    generate_synthetic_data(20000)
