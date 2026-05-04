import mlflow
import mlflow.sklearn
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score
import os

# MLflow Tracking URI
MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5050")
mlflow.set_tracking_uri(MLFLOW_URI)
mlflow.set_experiment("Product_Matching_v1")

def train_dummy_model():
    """
    Simulates training a model to identify duplicate products.
    In a real scenario, this would use text embeddings of product titles.
    """
    print(f"Connecting to MLflow at: {MLFLOW_URI}")
    
    with mlflow.start_run(run_name="RandomForest_Match_Attempt"):
        # 1. Create dummy data
        # Feature: Similarity score between two titles
        # Label: 1 if same product, 0 if different
        data = pd.DataFrame({
            'similarity': np.random.uniform(0, 1, 1000),
            'same_category': np.random.randint(0, 2, 1000)
        })
        # If similarity > 0.8, it's likely the same product
        data['is_duplicate'] = (data['similarity'] > 0.8).astype(int)
        
        X = data[['similarity', 'same_category']]
        y = data['is_duplicate']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

        # 2. Set Parameters
        n_estimators = 50
        max_depth = 5
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth)
        mlflow.log_param("algorithm", "RandomForest")

        # 3. Train Model
        clf = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth)
        clf.fit(X_train, y_train)

        # 4. Evaluate
        predictions = clf.predict(X_test)
        acc = accuracy_score(y_test, predictions)
        prec = precision_score(y_test, predictions)

        # 5. Log Metrics
        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("precision", prec)
        
        # 6. Log Model
        mlflow.sklearn.log_model(clf, "product_matcher_model")
        
        print(f"Training complete. Accuracy: {acc:.4f}. Check MLflow UI!")

if __name__ == "__main__":
    train_dummy_model()
