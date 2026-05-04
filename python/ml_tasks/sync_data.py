import os
import pandas as pd
import json
import sqlite3
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def _normalize_title(title: str) -> str:
    t = title.lower()
    t = re.sub(r'[^a-z0-9\s]', ' ', t)
    return " ".join(t.split())

def _get_cosine_sim(t1: str, t2: str) -> float:
    try:
        vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2,3))
        tfidf = vectorizer.fit_transform([t1, t2])
        return cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
    except:
        return 0.0

def run_standalone_sync():
    data_dir = "data"
    db_path = "data/database.sqlite" # or wherever the frontend reads from
    
    product_groups = {}
    brand_groups = {}
    normalized_titles_map = {}

    csv_files = [f for f in os.listdir(data_dir) if f.endswith("_products.csv")]
    
    for filename in csv_files:
        market_name = filename.replace("_products.csv", "").capitalize()
        df = pd.read_csv(os.path.join(data_dir, filename))
        
        for _, row in df.iterrows():
            title = str(row["title"])
            norm = _normalize_title(title)
            
            brand = "other"
            for b in ["apple", "samsung", "redmi", "xiaomi", "sony"]:
                if b in norm:
                    brand = b
                    break
            
            target_pid = None
            if norm in normalized_titles_map:
                target_pid = normalized_titles_map[norm]
            else:
                potential_pids = brand_groups.get(brand, [])
                for pid in potential_pids:
                    group = product_groups[pid]
                    if _get_cosine_sim(norm, _normalize_title(group["title"])) > 0.80:
                        target_pid = pid
                        normalized_titles_map[norm] = target_pid
                        break
            
            if not target_pid:
                target_pid = f"prod_{len(product_groups) + 1}"
                normalized_titles_map[norm] = target_pid
                if brand not in brand_groups: brand_groups[brand] = []
                brand_groups[brand].append(target_pid)
                
                product_groups[target_pid] = {
                    "id": target_pid,
                    "name": title,
                    "title": title,
                    "category": "Phones",
                    "price": row["price"],
                    "rating": 4.5,
                    "reviews": 25,
                    "image": row.get("image_url", ""),
                    "markets": []
                }
            
            product_groups[target_pid]["markets"].append({
                "source": market_name,
                "price": row["price"],
                "url": row.get("product_url", "#")
            })
            
            # Update min price
            if row["price"] < product_groups[target_pid]["price"]:
                product_groups[target_pid]["price"] = row["price"]

    # Export to JSON for the frontend to read as a mock API
    os.makedirs("frontend/public/api", exist_ok=True)
    final_products = list(product_groups.values())
    with open("frontend/public/api/products.json", "w") as f:
        json.dump({"products": final_products, "total": len(final_products)}, f)
    
    print(f"✅ Sync complete. Grouped {len(final_products)} products.")

if __name__ == "__main__":
    run_standalone_sync()
