"""
Preprocessing module for Bangkok transit daily ridership dataset.
Cleans raw daily_passenger.csv and pivots it into a continuous daily time-series.
"""

from pathlib import Path
import pandas as pd

# Mapping of dataset organization names to normalized line identifiers
LINE_MAPPING = {
    "BTS Green Line": "BTS_Green",
    "BTS Gold Line": "BTS_Gold",
    "MRT Blue Line": "MRT_Blue",
    "MRT Purple Line": "MRT_Purple",
    "MRT Yellow Line": "MRT_Yellow",
    "MRT Pink Line": "MRT_Pink",
    "ARL": "ARL",
    "Red Line": "SRT_Red",
    "SRT": "SRT",
}

# Reverse mapping from normalized identifiers back to display names
DISPLAY_NAMES = {v: k for k, v in LINE_MAPPING.items()}


DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "daily_passenger.csv"


def load_raw_data(data_path: str | Path = DEFAULT_DATA_PATH) -> pd.DataFrame:
    """Loads and formats the raw CSV dataset."""
    path = Path(data_path)
    if not path.exists():
        # Fallback to local working directory relative path if needed
        path = Path("data/daily_passenger.csv")
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path.resolve()}")

    df = pd.read_csv(path)

    # Clean Number_Passenger if it contains formatted string commas or non-numeric characters (Altair step)
    if df["Number_Passenger"].dtype == object:
        df["Number_Passenger"] = (
            df["Number_Passenger"]
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.strip()
            .str.replace(r"[^0-9.]", "0", regex=True)
        )
        df["Number_Passenger"] = pd.to_numeric(df["Number_Passenger"], errors="coerce").fillna(0)

    # Replace Thai earthquake note if present
    if "Note" in df.columns:
        thai_note = "ปิดให้บริการชั่วคราว เนื่องจากเกิดเหตุแผ่นดินไหว"
        eng_note = "Temporarily closed due to an earthquake"
        df["Note"] = df["Note"].replace({thai_note: eng_note})

    df["Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y")
    df = df.sort_values(by=["Date", "Organization"]).reset_index(drop=True)
    df["LineId"] = df["Organization"].map(LINE_MAPPING).fillna(df["Organization"])
    return df


def get_pivoted_timeseries(data_path: str | Path = DEFAULT_DATA_PATH) -> pd.DataFrame:
    """
    Transforms raw long-format records into a wide time-series matrix.
    Rows: Date (Daily frequency)
    Columns: Each transit line's passenger count
    """
    df = load_raw_data(data_path)
    pivoted = df.pivot(index="Date", columns="LineId", values="Number_Passenger")
    pivoted = pivoted.asfreq("D")

    # Yellow and Pink lines launched during 2023. For dates prior to launch, fill 0
    pivoted = pivoted.fillna(0)
    return pivoted


if __name__ == "__main__":
    df_pivot = get_pivoted_timeseries()
    print("Preprocessed time-series summary:")
    print(f"Date range: {df_pivot.index.min().date()} to {df_pivot.index.max().date()} ({len(df_pivot)} days)")
    print(f"Lines tracked: {list(df_pivot.columns)}")
    print(df_pivot.tail(3))

