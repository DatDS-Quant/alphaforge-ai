import argparse
import os

import numpy as np
import pandas as pd


def generate_sample_data(days: int = 1000, seed: int = 42) -> pd.DataFrame:
    """
    Generate deterministic synthetic daily OHLCV data using a geometric random walk.
    """
    rng = np.random.default_rng(seed)

    # Generate date range
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=days, freq="D")

    # Generate returns and close prices
    returns = rng.normal(loc=0.0002, scale=0.015, size=days)
    log_returns = np.log(1.0 + np.clip(returns, -0.9, 5.0))
    close_prices = 100.0 * np.exp(np.cumsum(log_returns))

    # Generate high, low, open, volume
    # To keep things realistic, high is close * (1 + positive dev), low is close * (1 - positive dev)
    # open is close from previous day (with a small overnight gap)
    df = pd.DataFrame(index=dates)
    df.index.name = "date"

    # Fill close
    df["close"] = close_prices

    # Generate open with overnight gaps
    open_pct_change = rng.normal(loc=0.0, scale=0.002, size=days)
    opens = np.zeros(days)
    opens[0] = close_prices[0] * (1.0 + open_pct_change[0])
    for i in range(1, days):
        opens[i] = close_prices[i - 1] * (1.0 + open_pct_change[i])
    df["open"] = opens

    # Generate high and low relative to open/close
    max_open_close = np.maximum(df["open"], df["close"])
    min_open_close = np.minimum(df["open"], df["close"])

    high_noise = np.abs(rng.normal(loc=0.005, scale=0.003, size=days))
    low_noise = np.abs(rng.normal(loc=0.005, scale=0.003, size=days))

    df["high"] = max_open_close * (1.0 + high_noise)
    df["low"] = min_open_close * (1.0 - low_noise)

    # Generate volume
    base_volume = 1_000_000
    volume_noise = rng.lognormal(mean=0.0, sigma=0.5, size=days)
    df["volume"] = (base_volume * volume_noise).astype(int)

    df = df.reset_index()
    # Format date as YYYY-MM-DD string or leave as datetime?
    # The requirement says "Convert date to datetime" in loader, so saving as string is standard for CSV.
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic daily OHLCV data.")
    parser.add_argument("--days", type=int, default=1000, help="Number of days to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument(
        "--output-path", type=str, default="data/sample_ohlcv.csv", help="Output CSV path."
    )

    args = parser.parse_args()

    df = generate_sample_data(days=args.days, seed=args.seed)

    # Ensure output directory exists
    dir_name = os.path.dirname(args.output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

    df.to_csv(args.output_path, index=False)
    print(f"Generated {args.days} days of sample data at {args.output_path}")


if __name__ == "__main__":
    main()
