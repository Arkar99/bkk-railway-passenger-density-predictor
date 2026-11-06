# 🚆 Bangkok Rail Route Planner & Passenger Crowd Forecaster
### ระบบค้นหาเส้นทางรถไฟฟ้าและพยากรณ์ความหนาแน่นผู้โดยสาร กรุงเทพฯ และปริมณฑล

[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3.5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![scikit--learn](https://img.shields.io/badge/scikit--learn-1.5+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Automated MLOps](https://img.shields.io/badge/MLOps-Monthly_CKAN_Sync-success?style=flat&logo=githubactions&logoColor=white)](.github/workflows/monthly_update.yml)

A high-performance, full-stack transit navigation and machine learning application for Bangkok's metropolitan railway network. It finds optimal transit paths across **10 rail lines and 4 distinct operating authorities**, while predicting daily passenger congestion levels and network bottlenecks using gradient-boosted machine learning models trained on 4+ years of official government ridership data.

---

## 🌟 Key Features

- **Multi-Agency Network Routing**: Seamless pathfinding across BTS, MRT, ARL, and SRT lines using an intelligent graph search algorithm based on Yen's K-Shortest Path with physical interchange hub grouping, transfer penalties, and specialized circular-loop handling for the MRT Blue Line.
- **Machine Learning Crowd Density Forecasting**: Real-time daily ridership predictions and crowd density scoring (0–100%, Low/Moderate/Busy/Crowded) powered by `HistGradientBoostingRegressor` models trained on official Thailand Department of Rail Transport data.
- **Full Bilingual Localization**: Complete dynamic English and Thai (`EN` / `TH`) language toggles for all stations, transit lines, route instructions, and crowd indicators.
- **FastAPI Asynchronous Microservice**: Lightweight, high-throughput Python backend serving real-time predictions, health checks, model metadata, and route bottleneck calculations.
- **Automated MLOps Monthly Ingestion Pipeline**: Ingestion script (`sync_data.py`) syncing monthly published datasets from the Thailand Open Government Data API (`opend.data.go.th`) paired with GitHub Actions for automated retraining. (WIP)
- **Modern Minimalist Design**: Glassmorphic aesthetic with official Bangkok rail line color coding, clear transfer badges, and accessibility-first enlarged typography.

---

## 🗺️ Transit Network Coverage

The system models **10 mass transit lines** spanning over 170+ stations and 30+ physical interchange hubs across Greater Bangkok:

| Line ID | Official Line Name | Thai Name | Operator | Color Code |
| :--- | :--- | :--- | :--- | :--- |
| `BTS_Sukhumvit` | BTS Sukhumvit Line (Green) | สายสุขุมวิท | BTSC | `#22c55e` |
| `BTS_Silom` | BTS Silom Line (Dark Green) | สายสีลม | BTSC | `#15803d` |
| `BTS_Gold` | BTS Gold Line (APM) | สายสีทอง | BTSC | `#d97706` |
| `MRT_Blue` | MRT Blue Line (Chaloem Ratchamongkhon) | สายสีน้ำเงิน | BEM | `#2563eb` |
| `MRT_Purple` | MRT Purple Line (Chalong Ratchadham) | สายสีม่วง | BEM | `#9333ea` |
| `MRT_Yellow` | MRT Yellow Line (Monorail) | สายสีเหลือง | EBM | `#eab308` |
| `MRT_Pink` | MRT Pink Line (Monorail) | สายสีชมพู | NBM | `#ec4899` |
| `ARL` | Airport Rail Link | แอร์พอร์ต เรล ลิงก์ | SRTET | `#dc2626` |
| `SRT_Red_Dark` | SRT Dark Red Line | สายสีแดงเข้ม (กรุงเทพอภิวัฒน์ - รังสิต) | SRTET | `#991b1b` |
| `SRT_Red_Light` | SRT Light Red Line | สายสีแดงอ่อน (กรุงเทพอภิวัฒน์ - ตลิ่งชัน) | SRTET | `#e11d48` |

---

## 📁 Repository Structure

```text
BKK_Train_Project/
├── .github/
│   └── workflows/
│       └── monthly_update.yml      # Scheduled GitHub Actions workflow for monthly sync & retrain
├── api/
│   ├── __init__.py
│   └── main.py                     # FastAPI REST API serving crowd predictions and metadata
├── data/
│   ├── processed/                  # Normalized historical daily ridership datasets (2022-2026)
│   └── raw/                        # Raw official CKAN CSV extracts
├── ml/
│   ├── models/
│   │   ├── historical_cache.csv    # Precomputed baseline ridership lookups
│   │   ├── metadata.json           # Model evaluation metrics (MAE, RMSE, MAPE, R2, P95 capacities)
│   │   └── passenger_models.joblib # Serialized scikit-learn model bundle
│   └── src/
│       ├── features.py             # Feature engineering (calendar, cyclical, Thai holidays)
│       ├── predict.py              # Single-date / line prediction engine
│       ├── preprocess.py           # Ingestion parsing and label harmonization
│       ├── sync_data.py            # Automated CKAN Open Data API client
│       └── train.py                # Model training and cross-validation script
├── notebooks/                      # Exploratory data analysis (EDA) notebooks
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Navigation header with language toggle
│   │   ├── RouteResults.jsx        # Smart Collapsible Metro Corridor and step cards
│   │   └── StationSelectors.jsx    # Color-coded line & station selection dropdowns
│   ├── styles/
│   │   └── App.css                 # Clean, modern borderless CSS styles
│   ├── utils/
│   │   └── crowdEstimator.js       # Client-side heuristic crowd prediction fallback
│   ├── App.jsx                     # Root React application component
│   ├── i18n.js                     # English / Thai localization dictionaries
│   ├── main.jsx                    # React DOM entry point
│   ├── railway_lines.js            # Network graph definition, stations, and interchange hubs
│   └── router.js                   # Pathfinding engine (Dijkstra + Yen's K-Shortest Path)
├── index.html                      # HTML5 template
├── package.json                    # Node dependencies & project scripts
├── requirements.txt                # Python backend & ML dependencies
├── vite.config.js                  # Vite bundler configuration
└── README.md                       # Project documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **Python**: v3.10 to v3.14
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Arkar99/bkk-railway-passenger-density-predictor.git
cd bkk-railway-passenger-density-predictor
```

### 2. Set Up Python Virtual Environment & Install Dependencies
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Install required Python packages
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Install Node.js Frontend Dependencies
```bash
npm install
```

---

## 🚀 Running the Application

For full functionality (route planning + live ML crowd predictions), run the Python backend and Vite frontend concurrently:

### Terminal 1: Start the FastAPI Backend
```bash
npm run api
```
*Backend runs at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).*

### Terminal 2: Start the React Frontend
```bash
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

> **Note:** If the backend is not running, the frontend gracefully falls back to an internal heuristic model (`crowdEstimator.js`), ensuring pathfinding and estimates remain uninterrupted.

---

## 📜 Available NPM Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 3000. |
| `npm run api` | Starts the FastAPI microservice on `127.0.0.1:8000` with hot-reload. |
| `npm run sync` | Pulls newly released ridership data from `data.go.th` and retrains ML models. |
| `npm run build` | Bundles and minifies the React application for production into `dist/`. |
| `npm run preview` | Locally previews the production build output. |

---

## 🔌 REST API Documentation

The FastAPI service exposes standard RESTful endpoints for crowd forecasting and network observability:

### 1. Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "model_version": "1.0.0",
  "lines_supported": ["ARL", "BTS_Gold", "BTS_Green", "MRT_Blue", "MRT_Pink", "MRT_Purple", "MRT_Yellow", "SRT", "SRT_Red"],
  "trained_date": "2026-11-02"
}
```

### 2. Predict Crowd by Date and Lines
```http
GET /api/predict?date=2026-11-06&lines=BTS_Sukhumvit,MRT_Blue
```
**Response:**
```json
{
  "date": "2026-11-06",
  "day_of_week": "Friday",
  "is_weekend": false,
  "is_holiday": false,
  "holiday_name": null,
  "composite_route_crowd": {
    "score": 83,
    "status_en": "Busy",
    "status_th": "คึกคัก",
    "color": "#f97316",
    "details": {
      "average_line_density": 81,
      "bottleneck_line_density": 85
    }
  },
  "lines": {
    "BTS_Green": {
      "predicted_passengers": 785420,
      "density_pct": 85,
      "density_level": "Busy",
      "p95_capacity": 873057
    },
    "MRT_Blue": {
      "predicted_passengers": 448100,
      "density_pct": 78,
      "density_level": "Busy",
      "p95_capacity": 522970
    }
  }
}
```

### 3. Model Metadata & Benchmark Metrics
```http
GET /api/metadata
```
Returns model evaluation performance across all transit lines, including Mean Absolute Percentage Error (MAPE), $R^2$ scores, and $P_{95}$ capacity baselines.

---

## 🤖 Machine Learning & MLOps Pipeline

### Model Details
- **Algorithm**: `HistGradientBoostingRegressor` (Histogram-based Gradient Boosting).
- **Features Extracted**:
  - Calendar components: day of week, day of month, month of year.
  - Cyclical temporal transforms: $\sin\left(\frac{2\pi \cdot \text{month}}{12}\right)$, $\cos\left(\frac{2\pi \cdot \text{month}}{12}\right)$.
  - Thailand National Public Holidays integration (`holidays.Thailand`).
  - School term / holiday indicators.
  - Long-term ridership trends and historical moving averages.
- **Validation**: 5-fold TimeSeriesSplit cross-validation achieving an average **MAPE < 8.5%** and **$R^2$ up to 0.85** on trunk lines (BTS Green & MRT Blue).

### Automated Monthly Sync (`sync_data.py`)
The Department of Rail Transport releases monthly passenger data on `opend.data.go.th`. To update the system without manual intervention:

```bash
# Dry run check for new records
python ml/src/sync_data.py --dry-run

# Ingest and automatically retrain models
python ml/src/sync_data.py --retrain
```

A scheduled GitHub Actions workflow ([`.github/workflows/monthly_update.yml`](.github/workflows/monthly_update.yml)) automatically triggers on the **5th of every month at 03:00 UTC** to check for fresh records, execute retraining, and commit updated weights.

---

## 📊 Data Source Attribution

- **Data Provider**: Department of Rail Transport (กรมการขนส่งทางราง - ขร.), Ministry of Transport, Thailand.
- **Portal**: [Open Government Data of Thailand (data.go.th)](https://opend.data.go.th/)
- **Resource Link**: https://data.go.th/en/dataset/stat_pass_rail


---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).

