"""
FastAPI Microservice for Bangkok Rail Transit Crowd Prediction.
Serves ML predictions and crowd density levels to the React Frontend.
"""

import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Compatibility shim for models pickled across scikit-learn / Cython versions
try:
    import sklearn._loss._loss
    sys.modules['_loss'] = sklearn._loss._loss
except (ImportError, AttributeError):
    pass

# Add ml/src to sys.path so we can import predict
sys.path.append(str(Path(__file__).resolve().parent.parent / "ml" / "src"))

from predict import predict_for_date, load_model_bundle

app = FastAPI(
    title="Bangkok Rail Crowd Prediction API",
    description="Machine Learning crowd density forecasting service for Bangkok transit networks.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 3000 / 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_info():
    """Root endpoint welcoming API consumers and pointing to interactive docs."""
    return {
        "service": "Bangkok Rail Transit Crowd Prediction API",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "predict": "/api/predict?date=YYYY-MM-DD[&lines=SRT_Red_Dark,MRT_Blue,...]",
            "metadata": "/api/metadata"
        }
    }

# Mapping between React frontend line IDs and ML model line IDs
LINE_KEY_MAP = {
    "BTS_Sukhumvit": "BTS_Green",
    "BTS_Silom": "BTS_Green",
    "BTS_Gold": "BTS_Gold",
    "MRT_Blue": "MRT_Blue",
    "MRT_Purple": "MRT_Purple",
    "MRT_Yellow": "MRT_Yellow",
    "MRT_Pink": "MRT_Pink",
    "ARL": "ARL",
    "SRT_Red_Dark": "SRT_Red",
    "SRT_Red_Light": "SRT_Red",
    "SRT": "SRT"
}


@app.get("/api/health")
def health_check():
    """Health check endpoint to verify ML model availability."""
    try:
        _, meta, _ = load_model_bundle()
        return {
            "status": "healthy",
            "model_version": "1.0.0",
            "lines_supported": list(meta["lines"].keys()),
            "trained_date": meta.get("training_date")
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


@app.get("/api/predict")
def predict_crowd(
    date: Optional[str] = Query(None, description="Target travel date in YYYY-MM-DD format (defaults to current date)"),
    lines: Optional[str] = Query(None, description="Comma-separated list of line IDs to filter")
):
    """
    Predicts passenger volume and crowd density score (0-100%) for a given date.
    Optionally computes composite route crowd metrics if specific lines are supplied.
    """
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    try:
        # Validate date format
        import pandas as pd
        pd.to_datetime(date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Translate frontend lines to ML model keys
    filter_ml_keys = None
    if lines:
        req_lines = [l.strip() for l in lines.split(",") if l.strip()]
        filter_ml_keys = list({LINE_KEY_MAP.get(l, l) for l in req_lines})

    try:
        raw_pred = predict_for_date(date, filter_ml_keys)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Compute aggregate composite route score if lines were provided
    composite = None
    if lines and raw_pred["lines"]:
        scores = [item["density_pct"] for item in raw_pred["lines"].values()]
        avg_score = round(sum(scores) / len(scores))
        max_score = max(scores)

        # Weighted composite: 60% max line congestion + 40% average
        composite_score = round(0.6 * max_score + 0.4 * avg_score)

        if composite_score >= 85:
            status_en, status_th, color = "Crowded", "หนาแน่นสูง", "#ef4444"
        elif composite_score >= 70:
            status_en, status_th, color = "Busy", "คึกคัก", "#f97316"
        elif composite_score >= 50:
            status_en, status_th, color = "Moderate", "ปานกลาง", "#eab308"
        else:
            status_en, status_th, color = "Light", "เบาบาง", "#10b981"

        # Pick representative advice from the most congested segment
        most_congested_line = max(raw_pred["lines"].items(), key=lambda kv: kv[1]["density_pct"])
        composite = {
            "score": composite_score,
            "status_en": status_en,
            "status_th": status_th,
            "badge_color": color,
            "bottleneck_line": most_congested_line[0],
            "notes_en": most_congested_line[1]["notes_en"],
            "notes_th": most_congested_line[1]["notes_th"]
        }

    # Ensure frontend-specific line IDs (e.g. SRT_Red_North, BTS_Sukhumvit) are also populated
    mapped_lines = dict(raw_pred["lines"])
    for fe_key, ml_key in LINE_KEY_MAP.items():
        if ml_key in raw_pred["lines"] and fe_key not in mapped_lines:
            mapped_lines[fe_key] = raw_pred["lines"][ml_key]

    return {
        "date": raw_pred["date"],
        "day_name_en": raw_pred["day_name_en"],
        "day_name_th": raw_pred["day_name_th"],
        "is_weekend": raw_pred["is_weekend"],
        "is_holiday": raw_pred["is_holiday"],
        "holiday": raw_pred["holiday"],
        "disclaimer_en": raw_pred.get("disclaimer_en"),
        "disclaimer_th": raw_pred.get("disclaimer_th"),
        "composite": composite,
        "lines": mapped_lines
    }


@app.get("/api/metadata")
def get_metadata():
    """Returns historical capacity benchmarks and model evaluation metrics."""
    try:
        _, meta, _ = load_model_bundle()
        return meta
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

