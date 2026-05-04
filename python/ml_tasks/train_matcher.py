import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import paired_cosine_distances
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import os

# Configure MLflow to point to the server or local URI
# If running locally without a remote server, it will log to local ./mlruns
MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5050")
try:
    mlflow.set_tracking_uri(MLFLOW_URI)
    mlflow.set_experiment("Product_Matching_Model_V3")
except Exception as e:
    print(f"⚠️ Could not connect to MLflow at {MLFLOW_URI}: {e}")
    print("Logging locally instead.")

def extract_features(df):
    """
    Extracts features for the ML model based on string comparisons.
    In a real scenario, this would include brand extraction, storage extraction, etc.
    """
    print("Extracting features...")
    # Fill NaN
    df['name_a'] = df['name_a'].fillna('').str.lower()
    df['name_b'] = df['name_b'].fillna('').str.lower()
    
    # 1. TF-IDF Cosine Similarity
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4))
    vectorizer.fit(pd.concat([df['name_a'], df['name_b']]))
    
    vec_a = vectorizer.transform(df['name_a'])
    vec_b = vectorizer.transform(df['name_b'])
    
    # Cosine similarity = 1 - cosine distance
    cosine_sim = 1 - paired_cosine_distances(vec_a, vec_b)
    
    # 2. Length difference
    len_diff = abs(df['name_a'].str.len() - df['name_b'].str.len())
    
    # Create feature matrix
    X = pd.DataFrame({
        'cosine_sim': cosine_sim,
        'len_diff': len_diff
    })
    
    return X, df['is_match'], vectorizer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier

def train():
    data_path = "data/processed_matching_data.csv"
    if not os.path.exists(data_path):
        print(f"❌ Data file not found at {data_path}. Run data_engineering.py first.")
        return

    df = pd.read_csv(data_path)
    X, y, vectorizer = extract_features(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = {
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        "LogisticRegression": LogisticRegression(random_state=42, max_iter=1000),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, random_state=42)
    }
    
    for model_name, clf in models.items():
        with mlflow.start_run(run_name=model_name):
            print(f"\nTraining {model_name}...")
            
            clf.fit(X_train, y_train)
            
            # Evaluate
            y_pred = clf.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred)
            rec = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            
            print(f"✅ [{model_name}] Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")
            
            # Log to MLflow
            mlflow.log_param("model_type", model_name)
            mlflow.log_param("dataset_size", len(df))
            
            mlflow.log_metric("accuracy", acc)
            mlflow.log_metric("precision", prec)
            mlflow.log_metric("recall", rec)
            mlflow.log_metric("f1_score", f1)
            
            try:
                mlflow.sklearn.log_model(clf, f"{model_name.lower()}_matcher")
                print(f"🎉 {model_name} successfully logged to MLflow!")
            except Exception as e:
                print(f"⚠️ Metrics were saved, but {model_name} model file could not be uploaded to MLflow.")
                print(f"   Error: {e}")

if __name__ == "__main__":
    train()
