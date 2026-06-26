import numpy as np
import pandas as pd


def generate_signals(
    alpha: pd.Series,
    mode: str = "long_short",
    upper_quantile: float = 0.7,
    lower_quantile: float = 0.3,
    min_periods: int = 30,
) -> pd.Series:
    """
    Generate trading signals from alpha values using expanding quantiles.
    To prevent future leakage, the quantile thresholds are shifted by 1 period,
    meaning the threshold for day t is computed using data from days 0 to t-1.
    """
    if mode not in ["long_short", "long_flat"]:
        raise ValueError(f"Unsupported signal mode: {mode}")

    if not (0.0 <= lower_quantile < upper_quantile <= 1.0):
        raise ValueError("Quantiles must satisfy 0.0 <= lower_quantile < upper_quantile <= 1.0")

    # Shift by 1 period to make thresholds strictly historical
    upper_thresh = alpha.expanding(min_periods=min_periods).quantile(upper_quantile).shift(1)
    lower_thresh = alpha.expanding(min_periods=min_periods).quantile(lower_quantile).shift(1)

    # Generate signals
    if mode == "long_short":
        signal_array = np.where(alpha > upper_thresh, 1, np.where(alpha < lower_thresh, -1, 0))
    else:  # long_flat
        signal_array = np.where(alpha > upper_thresh, 1, 0)

    signals = pd.Series(signal_array, index=alpha.index, dtype=int)

    # Handle NaN values explicitly: if alpha or threshold is NaN, signal must be 0
    signals[alpha.isna()] = 0
    signals[upper_thresh.isna()] = 0
    if mode == "long_short":
        signals[lower_thresh.isna()] = 0

    signals.name = "signal"
    return signals
