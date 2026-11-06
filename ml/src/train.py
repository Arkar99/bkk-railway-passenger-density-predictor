"""
Model training and evaluation module for Bangkok Rail Transit crowd prediction.
Trains Gradient Boosting models for each transit operator with time-series evaluation.
"""

import json
import sys
from pathlib import Path

# Ensure UTF-8 clean output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from preprocess import get_pivoted_timeseries
from features import build_training_dataset, build_calendar_features


def train_models():
    print("=" * 65)
    print("🚀 Training Bangkok Transit Crowd Prediction ML Models")
    print("=" * 65)

    df_pivot = get_pivoted_timeseries()
    datasets = build_training_dataset(df_pivot)
    calendar_df = build_calendar_features(df_pivot.index)
    calendar_feature_names = [c for c in calendar_df.columns if c != "holiday_name"]

    trained_models = {}
    evaluation_results = {}
    metadata = {
        "training_date": str(pd.Timestamp.now().date()),
        "data_range": {
            "start": str(df_pivot.index.min().date()),
            "end": str(df_pivot.index.max().date()),
            "total_days": len(df_pivot)
        },
        "lines": {}
    }

    print(f"\n📊 Evaluating models across {len(datasets)} transit lines (80% train / 20% test split):\n")
    print(f"{'Line':<14} | {'Train N':<7} | {'Test N':<6} | {'MAE':<10} | {'MAPE %':<8} | {'R2 Score':<8}")
    print("-" * 65)

    for line, data in datasets.items():
        X = data["X"]
        y = data["y"]

        # Time-based split: 80% train, 20% test
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        # 1. Primary Full-Feature Model (Calendar + Lags + Rolling stats)
        model = HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=10,
            random_state=42
        )
        model.fit(X_train, y_train)

        # 2. Calendar-Only Model (for forecasting arbitrary dates without rolling lags)
        X_cal_train = X_train[calendar_feature_names]
        cal_model = HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=10,
            random_state=42
        )
        cal_model.fit(X_cal_train, y_train)

        # Refit primary model on full data for best production performance
        prod_model = HistGradientBoostingRegressor(
            max_iter=180,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=10,
            random_state=42
        )
        prod_model.fit(X, y)

        prod_cal_model = HistGradientBoostingRegressor(
            max_iter=180,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=10,
            random_state=42
        )
        prod_cal_model.fit(X[calendar_feature_names], y)

        # Evaluation metrics on holdout test set
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mape = float(np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1))) * 100)
        r2 = float(r2_score(y_test, y_pred))

        evaluation_results[line] = {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "mape": round(mape, 2),
            "r2": round(r2, 4)
        }

        print(f"{line:<14} | {len(X_train):<7} | {len(X_test):<6} | {mae:<10.0f} | {mape:<7.2f}% | {r2:<8.3f}")

        # Compute line capacity benchmarks from historical data
        s_series = df_pivot[line][df_pivot[line] > 0]
        p95_capacity = float(np.percentile(s_series, 95))
        max_capacity = float(s_series.max())
        mean_ridership = float(s_series.mean())
        weekday_mean = float(s_series[s_series.index.day_of_week < 5].mean())
        weekend_mean = float(s_series[s_series.index.day_of_week >= 5].mean())

        metadata["lines"][line] = {
            "p95_capacity": round(p95_capacity),
            "max_capacity": round(max_capacity),
            "mean_ridership": round(mean_ridership),
            "weekday_mean": round(weekday_mean),
            "weekend_mean": round(weekend_mean),
            "evaluation": evaluation_results[line]
        }

        trained_models[line] = {
            "full_model": prod_model,
            "cal_model": prod_cal_model,
            "feature_names": data["feature_names"],
            "cal_features": calendar_feature_names
        }

    # Save models and metadata
    models_dir = Path(__file__).resolve().parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(trained_models, models_dir / "passenger_models.joblib")
    with open(models_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    # Save latest 365 days of pivoted historical timeseries for lag features lookup
    df_pivot.to_csv(models_dir / "historical_cache.csv")

    print("\n" + "=" * 65)
    print("✅ Training complete!")
    print(f"📁 Model bundle saved to:    {models_dir / 'passenger_models.joblib'}")
    print(f"📄 Metadata saved to:        {models_dir / 'metadata.json'}")
    print(f"💾 Historical cache saved to: {models_dir / 'historical_cache.csv'}")
    print("=" * 65)


if __name__ == "__main__":
    train_models()
