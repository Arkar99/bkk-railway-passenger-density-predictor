"""
Feature engineering module for Bangkok transit ridership prediction.
Extracts calendar features, Thai public holidays, lag values, and rolling window metrics.
"""

from datetime import datetime, date
import numpy as np
import pandas as pd

# Thai Public Holidays calendar (English & Thai labels)
THAI_HOLIDAYS = {
    "01-01": {"en": "New Year's Day", "th": "วันขึ้นปีใหม่"},
    "01-02": {"en": "New Year Substitution", "th": "วันหยุดชดเชยปีใหม่"},
    "02-26": {"en": "Makha Bucha Day", "th": "วันมาฆบูชา"},
    "04-06": {"en": "Chakri Memorial Day", "th": "วันจักรี"},
    "04-13": {"en": "Songkran Festival", "th": "วันสงกรานต์"},
    "04-14": {"en": "Songkran Festival", "th": "วันสงกรานต์"},
    "04-15": {"en": "Songkran Festival", "th": "วันสงกรานต์"},
    "04-16": {"en": "Songkran Substitution", "th": "วันหยุดชดเชยสงกรานต์"},
    "05-01": {"en": "National Labor Day", "th": "วันแรงงานแห่งชาติ"},
    "05-04": {"en": "Coronation Day", "th": "วันฉัตรมงคล"},
    "06-03": {"en": "Queen Suthida's Birthday", "th": "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี"},
    "07-28": {"en": "King Rama X's Birthday", "th": "วันเฉลิมพระชนมพรรษา ร.10"},
    "08-12": {"en": "Mother's Day", "th": "วันแม่แห่งชาติ"},
    "10-13": {"en": "King Rama IX Memorial Day", "th": "วันนวมินทรมหาราช"},
    "10-23": {"en": "Chulalongkorn Day", "th": "วันปิยมหาราช"},
    "12-05": {"en": "National Day / Father's Day", "th": "วันชาติ / วันพ่อแห่งชาติ"},
    "12-10": {"en": "Constitution Day", "th": "วันรัฐธรรมนูญ"},
    "12-31": {"en": "New Year's Eve", "th": "วันสิ้นปี"},
}


def get_holiday_details(dt: date | datetime) -> dict | None:
    """Returns holiday dictionary if date is a Thai national holiday, else None."""
    key = f"{dt.month:02d}-{dt.day:02d}"
    return THAI_HOLIDAYS.get(key, None)


def build_calendar_features(dates: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Constructs temporal, calendar, cyclical, and holiday features for a series of dates.
    """
    df = pd.DataFrame(index=dates)

    df["day_of_week"] = dates.day_of_week
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["month"] = dates.month
    df["day_of_month"] = dates.day
    df["day_of_year"] = dates.day_of_year
    df["quarter"] = dates.quarter
    df["week_of_year"] = dates.isocalendar().week.astype(int)

    # Cyclical encodings
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * (df["month"] - 1) / 12)
    df["month_cos"] = np.cos(2 * np.pi * (df["month"] - 1) / 12)

    # Thai Holidays & Seasonal Festivals
    is_holiday = []
    is_songkran = []
    is_new_year = []
    holiday_names = []

    for d in dates:
        h = get_holiday_details(d)
        if h:
            is_holiday.append(1)
            holiday_names.append(h["en"])
            is_songkran.append(1 if "Songkran" in h["en"] else 0)
            is_new_year.append(1 if "New Year" in h["en"] else 0)
        else:
            is_holiday.append(0)
            holiday_names.append("None")
            is_songkran.append(0)
            is_new_year.append(0)

    df["is_holiday"] = is_holiday
    df["is_songkran"] = is_songkran
    df["is_new_year"] = is_new_year
    df["holiday_name"] = holiday_names

    # Thai school semester breaks (March, April, October)
    df["is_school_break"] = df["month"].isin([3, 4, 10]).astype(int)

    return df


def build_training_dataset(pivoted_df: pd.DataFrame) -> dict:
    """
    Builds supervised training datasets for each transit line.
    Includes:
      - Calendar & holiday features
      - Historical lag features: lag_7 (1 week ago), lag_14, lag_364 (52 weeks ago - same weekday last year!)
      - Rolling statistics: 7-day, 14-day, 28-day moving average and standard deviation
    Returns dict: { line_id: (X, y, feature_names) }
    """
    calendar_df = build_calendar_features(pivoted_df.index)
    datasets = {}

    for line in pivoted_df.columns:
        s = pivoted_df[line].copy()
        
        # Skip leading zeros for lines that launched mid-dataset (e.g. Yellow & Pink)
        first_valid_idx = (s > 0).idxmax() if (s > 0).any() else s.index[0]
        s_active = s.loc[first_valid_idx:]

        line_features = calendar_df.loc[s_active.index].copy()

        # Lag features
        line_features["lag_7"] = s.shift(7).loc[s_active.index]
        line_features["lag_14"] = s.shift(14).loc[s_active.index]
        line_features["lag_364"] = s.shift(364).loc[s_active.index] # exactly 52 weeks ago (same day of week last year)
        
        # Rolling averages
        line_features["rolling_mean_7"] = s.shift(1).rolling(7).mean().loc[s_active.index]
        line_features["rolling_mean_14"] = s.shift(1).rolling(14).mean().loc[s_active.index]
        line_features["rolling_mean_28"] = s.shift(1).rolling(28).mean().loc[s_active.index]
        line_features["rolling_std_7"] = s.shift(1).rolling(7).std().loc[s_active.index]

        # Target variable
        target = s_active

        # Drop rows where lag features are NaN (e.g. first 28 days of line history)
        valid_mask = line_features["rolling_mean_28"].notna() & line_features["lag_7"].notna()
        X = line_features.loc[valid_mask].drop(columns=["holiday_name"])
        y = target.loc[valid_mask]

        datasets[line] = {
            "X": X,
            "y": y,
            "feature_names": list(X.columns)
        }

    return datasets


if __name__ == "__main__":
    from preprocess import get_pivoted_timeseries
    df_piv = get_pivoted_timeseries()
    datasets = build_training_dataset(df_piv)
    print("Training dataset built for lines:")
    for line, data in datasets.items():
        print(f"  {line:12s}: {len(data['X'])} training rows, {len(data['feature_names'])} features")
