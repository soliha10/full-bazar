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
        {"brand": "Apple", "model": "iPhone 15 Pro Max", "price": 18000000, "cat": "Phones"},
        {"brand": "Apple", "model": "iPhone 15 Pro", "price": 16000000, "cat": "Phones"},
        {"brand": "Apple", "model": "iPhone 15", "price": 12000000, "cat": "Phones"},
        {"brand": "Apple", "model": "iPhone 14 Pro Max", "price": 14500000, "cat": "Phones"},
        {"brand": "Apple", "model": "iPhone 14", "price": 11000000, "cat": "Phones"},
        {"brand": "Apple", "model": "iPhone 13", "price": 8500000, "cat": "Phones"},
        {"brand": "Apple", "model": "MacBook Pro M3", "price": 25000000, "cat": "Phones"},
        {"brand": "Apple", "model": "MacBook Air M2", "price": 14000000, "cat": "Phones"},
        {"brand": "Apple", "model": "AirPods Pro 2", "price": 3100000, "cat": "Phones"},
        {"brand": "Apple", "model": "Apple Watch Ultra 2", "price": 10500000, "cat": "Phones"},
        
        # Samsung
        {"brand": "Samsung", "model": "Galaxy S24 Ultra", "price": 17500000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy S24 Plus", "price": 14000000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy S24", "price": 11000000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy S23 Ultra", "price": 13500000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy A54 5G", "price": 4800000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy A34", "price": 3600000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy Z Fold 5", "price": 18500000, "cat": "Phones"},
        {"brand": "Samsung", "model": "Galaxy Z Flip 5", "price": 11000000, "cat": "Phones"},
        
        # Redmi / Xiaomi
        {"brand": "Redmi", "model": "Note 13 Pro Plus", "price": 5800000, "cat": "Phones"},
        {"brand": "Redmi", "model": "Note 13 Pro", "price": 4800000, "cat": "Phones"},
        {"brand": "Redmi", "model": "Note 13", "price": 3200000, "cat": "Phones"},
        {"brand": "Redmi", "model": "Note 12 Pro", "price": 4000000, "cat": "Phones"},
        {"brand": "Redmi", "model": "13C", "price": 1900000, "cat": "Phones"},
        {"brand": "Xiaomi", "model": "14 Ultra", "price": 16000000, "cat": "Phones"},
        {"brand": "Xiaomi", "model": "13T Pro", "price": 8800000, "cat": "Phones"},
        {"brand": "Xiaomi", "model": "Poco F5 Pro", "price": 6500000, "cat": "Phones"},
        {"brand": "Xiaomi", "model": "Poco X6 Pro", "price": 5000000, "cat": "Phones"}
    ]

    colors = ["Black", "White", "Blue", "Natural Titanium", "Silver", "Graphite", "Gold", "Green"]
    storages = ["128GB", "256GB", "512GB", "1TB"]

    os.makedirs("data", exist_ok=True)

    for store in stores:
        store_data = []
        for p in products:
            # Every store gets 2 variations of every product to show grouping works
            for i in range(2):
                color = random.choice(colors)
                storage = random.choice(storages)
                
                # Naming variations (Uzbek, Russian, English patterns)
                formats = [
                    f"{p['brand']} {p['model']} {storage} {color}",
                    f"Смартфон {p['brand']} {p['model']} {storage} {color}",
                    f"Smartfon {p['brand']} {p['model']} {storage}",
                    f"{p['model']} {storage} ({color})",
                    f"{p['brand']} {p['model']} {color}",
                    f"{p['model']} - {color} - {storage}",
                ]
                title = random.choice(formats)
                
                # Price calculation (base price * store multiplier * random jitter)
                # Ensure different prices for same product across stores
                price = int(p['price'] * store['price_mult'] * random.uniform(0.97, 1.03))
                
                store_data.append({
                    "title": title,
                    "price": price,
                    "category": "Phones",
                    "product_url": f"https://{store['name'].lower()}.uz/p/{random.randint(10000, 99999)}",
                    "image_url": f"https://picsum.photos/seed/{p['model'].replace(' ', '')}/400/400"
                })
        
        df = pd.DataFrame(store_data)
        df.to_csv(store['filename'], index=False)
        print(f"✅ Generated {len(store_data)} products for {store['name']} at {store['filename']}")

if __name__ == "__main__":
    generate_store_csvs()
