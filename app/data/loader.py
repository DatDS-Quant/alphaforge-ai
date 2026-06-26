import os

import pandas as pd


def load_ohlcv(file_path: str) -> pd.DataFrame:
    """
    Load OHLCV CSV data, validate columns, sort chronologically,
    clean missing values safely (no backward fill), and compute asset returns.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Data file not found at: {file_path}")

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read CSV file: {str(e)}") from e

    # Required columns check
    required_cols = ["date", "open", "high", "low", "close", "volume"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Convert date to datetime
    try:
        df["date"] = pd.to_datetime(df["date"])
    except Exception as e:
        raise ValueError(f"Failed to convert 'date' column to datetime: {str(e)}") from e

    # Sort chronologically
    df = df.sort_values("date").reset_index(drop=True)

    # Forward fill missing values on numeric columns only.
    # Do NOT backward fill because it leaks future information.
    numeric_cols = ["open", "high", "low", "close", "volume"]
    df[numeric_cols] = df[numeric_cols].ffill()

    # Drop any remaining NaNs in required columns
    df = df.dropna(subset=required_cols)

    if df.empty:
        raise ValueError("Dataframe is empty after dropping missing values.")

    # Calculate simple return based on close price.
    # return_t = (close_t - close_{t-1}) / close_{t-1}
    # This correctly aligns returns chronologically.
    df["return"] = df["close"].pct_change()

    # Fill the first row's return NaN with 0.0 or leave it as NaN?
    # Usually filling with 0.0 is safer for vectorized metrics and backtesting.
    df["return"] = df["return"].fillna(0.0)

    # Ensure date remains as a column as requested
    return df
