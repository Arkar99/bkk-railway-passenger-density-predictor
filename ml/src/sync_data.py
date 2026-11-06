"""
Automated Data Sync Script for Bangkok Rail Ridership.
Fetches the latest monthly records from the official Thailand Open Data (data.go.th) CKAN API,
appends new observations to daily_passenger.csv, and optionally triggers ML model retraining.

API Reference:
  Endpoint: https://opend.data.go.th/get-ckan/datastore_search
  Resource ID: 8a8d53fc-0c9c-4301-a354-8529bf487ceb
  Auth: 'api-key' header (free personal key from https://data.go.th)
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
import pandas as pd

# Ensure UTF-8 clean output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

API_BASE_URL = "https://opend.data.go.th/get-ckan/datastore_search"
RESOURCE_ID = "8a8d53fc-0c9c-4301-a354-8529bf487ceb"
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "daily_passenger.csv"


def get_latest_existing_date(csv_path: Path) -> pd.Timestamp | None:
    """Finds the most recent date currently stored in daily_passenger.csv."""
    if not csv_path.exists():
        return None
    try:
        df = pd.read_csv(csv_path, usecols=["Date"])
        dates = pd.to_datetime(df["Date"], format="%d/%m/%Y", errors="coerce").dropna()
        return dates.max()
    except Exception as e:
        print(f"⚠️ Warning: Could not parse existing dates: {e}")
        return None


def fetch_ckan_records(api_key: str, limit: int = 500, offset: int = 0) -> dict:
    """Queries the data.go.th CKAN datastore."""
    params = {
        "resource_id": RESOURCE_ID,
        "limit": limit,
        "offset": offset,
        "sort": "_id desc"  # Latest records first
    }
    url = f"{API_BASE_URL}?{urllib.parse.urlencode(params)}"
    headers = {
        "api-key": api_key.strip(),
        "User-Agent": "BKK-Train-ML-Ingestion/1.0"
    }

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if not data.get("success", False):
                raise RuntimeError(f"CKAN API returned failure: {data}")
            return data.get("result", {})
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        if e.code == 401:
            raise PermissionError(
                "401 Unauthorized: Invalid or missing data.go.th API key.\n"
                "Get your free key from https://data.go.th -> Profile -> API Key."
            )
        raise RuntimeError(f"HTTP Error {e.code}: {error_body}")


def sync_latest_data(api_key: str, auto_retrain: bool = False, dry_run: bool = False) -> int:
    """
    Fetches the newest records from data.go.th and appends them to daily_passenger.csv.
    Returns number of newly appended records.
    """
    latest_local_date = get_latest_existing_date(DATA_FILE)
    if latest_local_date:
        print(f"📅 Most recent date in local dataset: {latest_local_date.strftime('%Y-%m-%d')}")
    else:
        print("⚠️ No existing data found. Fetching initial dataset...")

    print("🌐 Connecting to data.go.th CKAN datastore...")
    result = fetch_ckan_records(api_key, limit=500, offset=0)
    records = result.get("records", [])
    total_in_db = result.get("total", len(records))
    print(f"📦 Fetched {len(records)} recent records (Total in CKAN: {total_in_db})")

    if not records:
        print("ℹ️ No records returned from official API.")
        return 0

    # Convert records to DataFrame
    df_api = pd.DataFrame(records)

    # Standardize column names
    col_map = {
        "date": "Date",
        "organization": "Organization",
        "number_passenger": "Number_Passenger",
        "note": "Note"
    }
    df_api.rename(columns={c: col_map[c.lower()] for c in df_api.columns if c.lower() in col_map}, inplace=True)

    # Parse and filter for strictly new records
    df_api["parsed_dt"] = pd.to_datetime(df_api["Date"], format="%d/%m/%Y", errors="coerce")
    df_api = df_api.dropna(subset=["parsed_dt"])

    if latest_local_date:
        new_records_df = df_api[df_api["parsed_dt"] > latest_local_date].copy()
    else:
        new_records_df = df_api.copy()

    if new_records_df.empty:
        print("✅ Local dataset is already up to date! No new monthly dates available yet.")
        return 0

    # Sort chronologically
    new_records_df = new_records_df.sort_values(by=["parsed_dt", "Organization"])
    new_dates = new_records_df["parsed_dt"].dt.strftime("%Y-%m-%d").unique()
    print(f"✨ Found {len(new_records_df)} new records across {len(new_dates)} days: {new_dates[0]} → {new_dates[-1]}")

    if dry_run:
        print("🔍 [DRY RUN] Would append the following records:")
        print(new_records_df[["Date", "Organization", "Number_Passenger"]].head(10))
        return len(new_records_df)

    # Load existing file to determine next sequential "No."
    df_existing = pd.read_csv(DATA_FILE)
    last_no = df_existing["No."].dropna().max() if "No." in df_existing.columns and not df_existing.empty else 0

    # Format new rows to match daily_passenger.csv schema
    prepared_rows = []
    for idx, row in new_records_df.iterrows():
        last_no += 1
        psg_val = row["Number_Passenger"]
        if isinstance(psg_val, str):
            psg_val = float(psg_val.replace(",", "").strip() or 0)

        prepared_rows.append({
            "No.": float(last_no),
            "Date": row["Date"],
            "Organization": row["Organization"],
            "Number_Passenger": float(psg_val),
            "Note": row.get("Note", "")
        })

    df_to_append = pd.DataFrame(prepared_rows)
    df_updated = pd.concat([df_existing, df_to_append], ignore_index=True)
    df_updated.to_csv(DATA_FILE, index=False)
    print(f"💾 Appended {len(df_to_append)} records. Total rows now: {len(df_updated):,}")

    if auto_retrain:
        print("\n🚀 Auto-triggering ML model retraining...")
        from train import train_models
        train_models()
        print("✅ Retraining complete! Fresh models & cache are ready for deployment.")

    return len(df_to_append)


def main():
    parser = argparse.ArgumentParser(description="Sync monthly ridership data from data.go.th")
    parser.add_argument(
        "--api-key",
        type=str,
        default=os.getenv("DATA_GO_TH_API_KEY"),
        help="data.go.th API Key (or set DATA_GO_TH_API_KEY env variable)"
    )
    parser.add_argument(
        "--retrain",
        action="store_true",
        help="Automatically trigger ML model retraining if new records are found"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check and preview new records without modifying files"
    )
    args = parser.parse_args()

    if not args.api_key:
        print("❌ Error: data.go.th API Key is required.")
        print("Usage: python ml/src/sync_data.py --api-key YOUR_KEY [--retrain]")
        print("Or set the environment variable: $env:DATA_GO_TH_API_KEY = 'YOUR_KEY'")
        print("Get your free key from: https://data.go.th (Log in -> Profile -> API Key)")
        sys.exit(1)

    try:
        sync_latest_data(args.api_key, auto_retrain=args.retrain, dry_run=args.dry_run)
    except Exception as e:
        print(f"\n❌ Sync failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

