import pandas as pd
import random
import os

def generate_store_csvs():
    """
    Generates multiple CSV files representing different online stores.
    Each store contains the same products but with variations in names and prices.
    Focuses on Apple, Samsung, and Redmi.
    """
    stores = [
        {"name": "Texnomart", "filename": "data/texnomart_products.csv", "price_mult": 1.0},
        {"name": "Olcha", "filename": "data/olcha_products.csv", "price_mult": 0.98},
        {"name": "Asaxiy", "filename": "data/asaxiy_products.csv", "price_mult": 1.02},
        {"name": "Mediapark", "filename": "data/mediapark_products.csv", "price_mult": 0.95},
        {"name": "Uzum", "filename": "data/uzum_products.csv", "price_mult": 1.05},
        {"name": "Beemarket", "filename": "data/beemarket_products.csv", "price_mult": 0.97}
    ]

    # Base products and their base prices (in UZS)
    products = [
        # Apple
        {"brand": "Apple", "model": "iPhone 15 Pro Max", "price": 18000000, "cat": "Smartphones"},
        {"brand": "Apple", "model": "iPhone 15 Pro", "price": 16000000, "cat": "Smartphones"},
        {"brand": "Apple", "model": "iPhone 15", "price": 12000000, "cat": "Smartphones"},
        {"brand": "Apple", "model": "iPhone 14 Pro", "price": 14000000, "cat": "Smartphones"},
        {"brand": "Apple", "model": "iPhone 13", "price": 9000000, "cat": "Smartphones"},
        {"brand": "Apple", "model": "MacBook Air M2", "price": 13000000, "cat": "Laptops"},
        {"brand": "Apple", "model": "AirPods Pro 2", "price": 3000000, "cat": "Electronics"},
        
        # Samsung
        {"brand": "Samsung", "model": "Galaxy S24 Ultra", "price": 17000000, "cat": "Smartphones"},
        {"brand": "Samsung", "model": "Galaxy S24+", "price": 13000000, "cat": "Smartphones"},
        {"brand": "Samsung", "model": "Galaxy A54 5G", "price": 4500000, "cat": "Smartphones"},
        {"brand": "Samsung", "model": "Galaxy A34", "price": 3500000, "cat": "Smartphones"},
        {"brand": "Samsung", "model": "Galaxy Z Fold 5", "price": 19000000, "cat": "Smartphones"},
        
        # Redmi / Xiaomi
        {"brand": "Redmi", "model": "Note 13 Pro+", "price": 5500000, "cat": "Smartphones"},
        {"brand": "Redmi", "model": "Note 13 Pro", "price": 4500000, "cat": "Smartphones"},
        {"brand": "Redmi", "model": "Note 13", "price": 3000000, "cat": "Smartphones"},
        {"brand": "Redmi", "model": "13C", "price": 1800000, "cat": "Smartphones"},
        {"brand": "Xiaomi", "model": "14 Ultra", "price": 15000000, "cat": "Smartphones"},
        {"brand": "Xiaomi", "model": "13T Pro", "price": 8500000, "cat": "Smartphones"}
    ]

    colors = ["Black", "White", "Blue", "Titanium", "Silver", "Graphite"]
    storages = ["128GB", "256GB", "512GB"]

    os.makedirs("data", exist_ok=True)

    for store in stores:
        store_data = []
        for p in products:
            # Generate 2-3 variants of each product per store to simulate real scraping noise
            for _ in range(random.randint(1, 2)):
                color = random.choice(colors)
                storage = random.choice(storages)
                
                # Naming variations
                formats = [
                    f"{p['brand']} {p['model']} {storage} {color}",
                    f"Смартфон {p['brand']} {p['model']} {storage}",
                    f"{p['model']} ({storage}) {color}",
                    f"{p['brand']} {p['model']} - {color}",
                ]
                title = random.choice(formats)
                
                # Price calculation (base price * store multiplier * random jitter)
                price = int(p['price'] * store['price_mult'] * random.uniform(0.98, 1.02))
                
                store_data.append({
                    "title": title,
                    "price": price,
                    "category": p['cat'],
                    "product_url": f"https://{store['name'].lower()}.uz/p/{random.randint(1000, 9999)}",
                    "image_url": f"https://picsum.photos/seed/{p['model'].replace(' ', '')}/400/400"
                })
        
        df = pd.DataFrame(store_data)
        df.to_csv(store['filename'], index=False)
        print(f"✅ Generated {len(store_data)} products for {store['name']} at {store['filename']}")

if __name__ == "__main__":
    generate_store_csvs()
