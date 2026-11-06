"""
Inference module for Bangkok Transit Crowd Prediction.
Predicts passenger volume and crowd density index for any chosen travel date.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

# Ensure UTF-8 clean output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Compatibility shim for models pickled across different scikit-learn / Cython versions
try:
    import sklearn._loss._loss
    sys.modules['_loss'] = sklearn._loss._loss
except (ImportError, AttributeError):
    pass

from features import build_calendar_features, get_holiday_details

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def load_model_bundle():
    """Loads trained models and capacity metadata."""
    model_path = MODELS_DIR / "passenger_models.joblib"
    meta_path = MODELS_DIR / "metadata.json"
    cache_path = MODELS_DIR / "historical_cache.csv"

    if not model_path.exists() or not meta_path.exists():
        raise FileNotFoundError(
            "Trained models not found. Please run 'python ml/src/train.py' first."
        )

    models = joblib.load(model_path)
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    cache = pd.read_csv(cache_path, index_col=0, parse_dates=True) if cache_path.exists() else None
    return models, meta, cache


def predict_for_date(date_str: str, target_lines: list[str] | None = None) -> dict:
    """
    Predicts passenger volume and crowd density for a given date across transit lines.
    
    :param date_str: Date string in 'YYYY-MM-DD' format.
    :param target_lines: Optional list of line IDs to filter.
    :return: Dictionary containing predictions, crowd density scores, and commuter advice.
    """
    models, meta, cache = load_model_bundle()
    target_dt = pd.to_datetime(date_str)
    dates_idx = pd.DatetimeIndex([target_dt])

    cal_df = build_calendar_features(dates_idx)
    cal_features = [c for c in cal_df.columns if c != "holiday_name"]
    holiday = get_holiday_details(target_dt)

    is_weekend = int(target_dt.day_of_week in [5, 6])
    day_names_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_names_th = ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"]
    day_name_en = day_names_en[target_dt.day_of_week]
    day_name_th = day_names_th[target_dt.day_of_week]

    results = {
        "date": date_str,
        "day_of_week": int(target_dt.day_of_week),
        "day_name_en": day_name_en,
        "day_name_th": day_name_th,
        "is_weekend": bool(is_weekend),
        "is_holiday": bool(holiday),
        "holiday": holiday,
        "disclaimer_en": "Daily Aggregate Forecast: Predictions reflect total ridership across the entire day. Actual congestion varies significantly between peak rush hours (07:00-09:00, 17:30-19:30) and quiet off-peak hours.",
        "disclaimer_th": "การพยากรณ์ภาพรวมตลอดทั้งวัน: ข้อมูลนี้สะท้อนปริมาณผู้โดยสารรวมทั้งวัน ความหนาแน่นจริงอาจแตกต่างกันอย่างมากระหว่างช่วงเวลาเร่งด่วน (07:00-09:00 น. และ 17:30-19:30 น.) กับช่วงเวลาปกติที่เบาบาง",
        "lines": {}
    }

    selected_lines = target_lines if target_lines else list(models.keys())

    for line in selected_lines:
        if line not in models:
            continue

        model_entry = models[line]
        line_meta = meta["lines"].get(line, {})
        p95_cap = line_meta.get("p95_capacity", 500000)

        # Check if historical lags are available in cache
        has_lags = False
        lag_features = {}
        if cache is not None and line in cache.columns:
            try:
                lag7_dt = target_dt - pd.Timedelta(days=7)
                lag14_dt = target_dt - pd.Timedelta(days=14)
                lag364_dt = target_dt - pd.Timedelta(days=364)

                if lag7_dt in cache.index and lag14_dt in cache.index:
                    s_series = cache[line]
                    lag_features["lag_7"] = float(s_series.loc[lag7_dt])
                    lag_features["lag_14"] = float(s_series.loc[lag14_dt])
                    lag_features["lag_364"] = float(s_series.loc[lag364_dt]) if lag364_dt in cache.index else lag_features["lag_7"]

                    # Rolling averages from cache
                    prev_slice = s_series.loc[:target_dt - pd.Timedelta(days=1)].tail(28)
                    if len(prev_slice) >= 7:
                        lag_features["rolling_mean_7"] = float(prev_slice.tail(7).mean())
                        lag_features["rolling_mean_14"] = float(prev_slice.tail(14).mean())
                        lag_features["rolling_mean_28"] = float(prev_slice.mean())
                        lag_features["rolling_std_7"] = float(prev_slice.tail(7).std() or 0)
                        has_lags = True
            except Exception:
                has_lags = False

        # Predict passenger count
        if has_lags:
            full_input = cal_df.copy()
            for k, v in lag_features.items():
                full_input[k] = v
            pred_count = float(model_entry["full_model"].predict(full_input[model_entry["feature_names"]])[0])
        else:
            cal_input = cal_df[cal_features]
            pred_count = float(model_entry["cal_model"].predict(cal_input)[0])

        pred_count = max(0, round(pred_count))

        # Calculate Crowd Density Index (%) relative to 95th percentile capacity
        density_pct = min(100, max(10, round((pred_count / p95_cap) * 100)))

        # Categorize Crowd Level
        if density_pct >= 85:
            status_en, status_th = "Crowded", "หนาแน่นสูง"
            badge_color = "#ef4444"
        elif density_pct >= 70:
            status_en, status_th = "Busy", "คึกคัก"
            badge_color = "#f97316"
        elif density_pct >= 50:
            status_en, status_th = "Moderate", "ปานกลาง"
            badge_color = "#eab308"
        else:
            status_en, status_th = "Light", "เบาบาง"
            badge_color = "#10b981"

        # Generate Contextual Notes
        if holiday:
            if "Songkran" in holiday["en"]:
                notes_en = f"Songkran Festival ({holiday['en']}) — Major holiday lull, smooth transit."
                notes_th = f"เทศกาลสงกรานต์ ({holiday['th']}) — วันหยุดยาว ผู้โดยสารเบาบาง เดินทางสะดวก"
            elif "New Year" in holiday["en"]:
                notes_en = f"{holiday['en']} — Festive holiday schedule, relaxed crowds."
                notes_th = f"{holiday['th']} — วันหยุดเทศกาลปีใหม่ ผู้โดยสารท่องเที่ยว"
            else:
                notes_en = f"Public Holiday ({holiday['en']}) — Off-peak service frequency."
                notes_th = f"วันหยุดราชการ ({holiday['th']}) — ไม่หนาแน่น เดินทางสบาย"
        elif is_weekend:
            notes_en = f"{day_name_en} — Weekend leisure ridership, moderate shopping traffic."
            notes_th = f"{day_name_th} — วันหยุดสุดสัปดาห์ การเดินทางพักผ่อนปานกลาง"
        else:
            if target_dt.day_of_week in [0, 4]:
                notes_en = f"{day_name_en} — Peak rush hour commuter congestion expected."
                notes_th = f"{day_name_th} — ชั่วโมงเร่งด่วนช่วงเช้า/เย็น ผู้โดยสารหนาแน่นสูง"
            else:
                notes_en = f"{day_name_en} — Typical weekday business commuter volume."
                notes_th = f"{day_name_th} — วันทำงานปกติ การโดยสารตามรอบเวลา"

        results["lines"][line] = {
            "predicted_passengers": pred_count,
            "density_pct": density_pct,
            "status_en": status_en,
            "status_th": status_th,
            "badge_color": badge_color,
            "notes_en": notes_en,
            "notes_th": notes_th,
            "benchmark_p95": p95_cap
        }

    return results


if __name__ == "__main__":
    test_date = sys.argv[1] if len(sys.argv) > 1 else "2026-11-02"
    pred = predict_for_date(test_date)
    print(f"\n🔮 Bangkok Transit Crowd Forecast for {pred['date']} ({pred['day_name_en']})")
    if pred["is_holiday"]:
        print(f"🌟 Holiday: {pred['holiday']['en']} ({pred['holiday']['th']})")
    print("-" * 75)
    print(f"{'Line':<14} | {'Predicted Passengers':<20} | {'Crowd Score':<12} | {'Level'}")
    print("-" * 75)
    for line_id, data in pred["lines"].items():
        print(f"{line_id:<14} | {data['predicted_passengers']:<20,d} | {data['density_pct']:>3d}% ({data['badge_color']}) | {data['status_en']} ({data['status_th']})")
    print("-" * 75)
    print(f"\nℹ️  {pred['disclaimer_en']}")
    print(f"ℹ️  {pred['disclaimer_th']}\n")

