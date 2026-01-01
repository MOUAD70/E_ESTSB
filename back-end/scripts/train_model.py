import os
import pandas as pd
import joblib
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "data", "candidates_synthetic.csv")

df = pd.read_csv(csv_path)
print("Loaded:", csv_path, df.shape)

target = "selected"

cat_cols = ["t_diplome", "branche_diplome", "bac_type", "filiere"]
num_cols = ["m_s1", "m_s2", "m_s3", "m_s4"]

X = df[cat_cols + num_cols]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

preprocess = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ("num", "passthrough", num_cols),
    ]
)

clf = RandomForestClassifier(
    n_estimators=800,
    max_depth=14,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

pipe = Pipeline([
    ("preprocess", preprocess),
    ("model", clf)
])

pipe.fit(X_train, y_train)

# default threshold 0.5
y_pred = pipe.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print("\n=== Threshold 0.50 (default) ===")
print(f"Accuracy: {acc:.4f}")
print(classification_report(y_test, y_pred))

# test other thresholds (useful for admissions)
proba = pipe.predict_proba(X_test)[:, 1]
for t in [0.35, 0.40, 0.45]:
    y_pred_t = (proba >= t).astype(int)
    print(f"\n=== Threshold {t:.2f} ===")
    print(classification_report(y_test, y_pred_t))

encoders_dir = os.path.join(base_dir, "encoders")
os.makedirs(encoders_dir, exist_ok=True)

model_path = os.path.join(encoders_dir, "rf_pipeline.pkl")
joblib.dump(pipe, model_path)
print("\nSaved pipeline to:", model_path)
