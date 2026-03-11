import os
import pandas as pd
import joblib
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "data", "candidates_synthetic.csv")

df = pd.read_csv(csv_path)
print("Loaded:", csv_path, df.shape)

# Target: predict average semester score directly (0-20 scale)
target = "avg_semester_score"

cat_cols = ["t_diplome", "branche_diplome", "bac_type", "filiere"]
num_cols = ["moy_bac", "m_s1", "m_s2", "m_s3", "m_s4"]

X = df[cat_cols + num_cols]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

preprocess = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ("num", "passthrough", num_cols),
    ]
)

# Use RandomForestRegressor to predict student performance (0-20 scale)
rf = RandomForestRegressor(
    n_estimators=800,
    max_depth=14,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)

pipe = Pipeline([
    ("preprocess", preprocess),
    ("model", rf)
])

print("\nTraining RandomForestRegressor to predict average semester score...")
pipe.fit(X_train, y_train)

# Evaluate performance
y_pred = pipe.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mse)

print("\n=== Regression Model Performance ===")
print(f"Mean Squared Error (MSE): {mse:.4f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"R² Score (coefficient of determination): {r2:.4f}")

# Show predictions vs actual for first 10 test samples
print("\n=== Sample Predictions vs Actual ===")
comparison = pd.DataFrame({
    "Actual": y_test.iloc[:10].values,
    "Predicted": y_pred[:10]
})
print(comparison)

# Show prediction range
print("\nPrediction statistics:")
print(f"  Min predicted: {y_pred.min():.2f}")
print(f"  Max predicted: {y_pred.max():.2f}")
print(f"  Mean predicted: {y_pred.mean():.2f}")
print(f"  Std predicted: {y_pred.std():.2f}")

encoders_dir = os.path.join(base_dir, "encoders")
os.makedirs(encoders_dir, exist_ok=True)

model_path = os.path.join(encoders_dir, "rf_pipeline.pkl")
joblib.dump(pipe, model_path)
print(f"\nSaved regressor pipeline to: {model_path}")
