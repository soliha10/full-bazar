import pandas as pd
import glob
import os
import random
import re

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Normalize storage formats (e.g. 128 gb -> 128gb)
    text = re.sub(r'(\d+)\s*(gb|tb)', r'\1\2', text)
    # Remove special characters but keep alphanumeric and spaces
    text = re.sub(r'[^a-z0-9\sа-я]', ' ', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def augment_title(title):
    """Creates a slightly varied version of the title for positive pairs."""
    words = title.split()
    if len(words) < 3:
        return title + " " + random.choice(["black", "white", "new"])
    
    # 1. Randomly drop a word (like color or redundant word)
    if random.random() > 0.5:
        drop_idx = random.randint(0, len(words) - 1)
        return " ".join([w for i, w in enumerate(words) if i != drop_idx])
    
    # 2. Swap words
    idx1, idx2 = random.sample(range(len(words)), 2)
    words[idx1], words[idx2] = words[idx2], words[idx1]
    return " ".join(words)

def build_data_pipeline():
    print("🚀 Boshlanmoqda: Real ma'lumotlarni o'qish va tozalash...")
    
    # Barcha real CSV fayllarni topish
    csv_files = glob.glob("data/*_products.csv")
    
    all_titles = []
    for f in csv_files:
        try:
            df = pd.read_csv(f)
            if 'title' in df.columns:
                all_titles.extend(df['title'].dropna().tolist())
        except Exception as e:
            print(f"Error reading {f}: {e}")
            
    # Tozalash
    cleaned_titles = list(set([clean_text(t) for t in all_titles if len(str(t)) > 5]))
    print(f"📊 Jami {len(cleaned_titles)} ta real, noyob va tozalangan tovar nomlari topildi.")
    
    # Real ma'lumotlardan juftliklar (Pairs) yaratish
    real_pairs = []
    
    # 1. Positive pairs (1) - O'xshash tovarlar
    for title in cleaned_titles:
        if random.random() > 0.7:  # 30% tovarlardan o'xshash juftlik yaratamiz
            real_pairs.append({
                "name_a": title,
                "name_b": augment_title(title),
                "is_match": 1
            })
            
    # 2. Negative pairs (0) - Har xil tovarlar
    num_negatives = len(real_pairs)
    for _ in range(num_negatives):
        t1, t2 = random.sample(cleaned_titles, 2)
        real_pairs.append({
            "name_a": t1,
            "name_b": t2,
            "is_match": 0
        })
        
    real_df = pd.DataFrame(real_pairs)
    print(f"📈 Real datalardan {len(real_df)} ta juftlik yaratildi.")
    
    # 3. Sintetik datalarni qo'shish
    synthetic_path = "data/synthetic_matching_data.csv"
    if os.path.exists(synthetic_path):
        synth_df = pd.read_csv(synthetic_path)
        print(f"🤖 Sintetik datalardan {len(synth_df)} ta juftlik topildi.")
        final_df = pd.concat([real_df, synth_df], ignore_index=True)
    else:
        print("⚠️ Sintetik data topilmadi, faqat real data ishlatiladi.")
        final_df = real_df
        
    # Shuffle (Aralashtirish)
    final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Saqlash
    output_path = "data/processed_matching_data.csv"
    final_df.to_csv(output_path, index=False)
    print(f"✅ Data Engineering yakunlandi! Barcha ma'lumotlar birlashtirildi: {output_path} ({len(final_df)} qator)")

if __name__ == "__main__":
    build_data_pipeline()
