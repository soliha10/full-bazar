import pandas as pd
import random
import os

def generate_synthetic_data(num_samples=10000):
    """
    Generates synthetic product matching data for training the ML model.
    1 = Match (Same product, slight name variations)
    0 = Non-Match (Different products, similar categories)
    """
    brands = {
        "Apple": ["iPhone 14 Pro", "iPhone 15", "MacBook Air M2", "AirPods Pro 2", "iPad Air 5", "iPhone 13 mini", "Apple Watch Ultra"],
        "Samsung": ["Galaxy S23 Ultra", "Galaxy A54", "Galaxy Watch 6", "Galaxy Buds 2", "Galaxy Z Fold 5", "Galaxy Tab S9", "Samsung A04"],
        "Xiaomi": ["Redmi Note 12", "Poco X5 Pro", "Xiaomi 13T", "Mi Band 8", "Redmi Pad", "Xiaomi 14", "Redmi 12C"],
        "Sony": ["PlayStation 5", "WH-1000XM5", "Bravia XR", "Xperia 1 V", "WF-1000XM4", "DualSense Controller"],
        "Google": ["Pixel 8 Pro", "Pixel 7a", "Pixel Watch 2", "Pixel Buds Pro"],
        "Asus": ["ROG Phone 7", "Zenfone 10", "Vivobook S15", "TUF Gaming F15"],
        "HP": ["Pavilion 15", "Victus 16", "Envy x360", "LaserJet Pro"]
    }

    colors = ["Black", "White", "Blue", "Green", "Silver", "Graphite", "Gold", "Midnight", "Purple"]
    storages = ["64GB", "128GB", "256GB", "512GB", "1TB", "32GB"]
    memories = ["4GB", "8GB", "12GB", "16GB", "32GB", "2GB"]
    
    variations = [
        lambda name, b, c, s, m: f"{b} {name} {s} {c}",
        lambda name, b, c, s, m: f"{name} {s} ({c})",
        lambda name, b, c, s, m: f"{b} {name} {m}/{s} {c}",
        lambda name, b, c, s, m: f"Смартфон {b} {name} {s}",
        lambda name, b, c, s, m: f"{name} {c} {s}",
        lambda name, b, c, s, m: f"{b} {name}",
        lambda name, b, c, s, m: f"{name} {s}",
        lambda name, b, c, s, m: f"Noutbuk {b} {name} {m} {s}"
    ]

    data = []

    for _ in range(num_samples):
        is_match = random.choice([0, 1])
        brand = random.choice(list(brands.keys()))
        
        if is_match:
            # Generate two matching products with different naming formats
            base_product = random.choice(brands[brand])
            color = random.choice(colors)
            storage = random.choice(storages)
            memory = random.choice(memories)
            
            var1 = random.choice(variations)
            var2 = random.choice(variations)
            
            name_a = var1(base_product, brand, color, storage, memory)
            name_b = var2(base_product, brand, color, storage, memory)
        else:
            # Generate two completely different products, or same product with different specs
            base_product_1 = random.choice(brands[brand])
            base_product_2 = random.choice(brands[brand])
            color1, color2 = random.sample(colors, 2)
            storage1, storage2 = random.sample(storages, 2)
            memory = random.choice(memories)
            
            var1 = random.choice(variations)
            var2 = random.choice(variations)
            
            # 50% chance they are the same model but different storage (non-match for price aggregation)
            if random.choice([True, False]):
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_1, brand, color2, storage2, memory) # Different storage
            else:
                # Different model or brand
                brand2 = random.choice(list(brands.keys()))
                name_a = var1(base_product_1, brand, color1, storage1, memory)
                name_b = var2(base_product_2, brand2, color2, storage1, memory) 
                
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
    generate_synthetic_data(10000)
