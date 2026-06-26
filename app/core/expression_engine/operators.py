import numpy as np
import pandas as pd


def _check_window(window) -> int:
    """
    Ensure the window parameter is a positive integer.
    """
    if isinstance(window, float) and window.is_integer():
        window = int(window)
    if not isinstance(window, int) or window <= 0:
        raise ValueError(f"Window must be a positive integer, got: {window}")
    return window


def ts_mean(series: pd.Series, window: int) -> pd.Series:
    """
    Rolling mean over a window.
    """
    w = _check_window(window)
    return series.rolling(window=w, min_periods=1).mean()


def ts_std(series: pd.Series, window: int) -> pd.Series:
    """
    Rolling standard deviation over a window.
    """
    w = _check_window(window)
    # ddof=1 is pandas default. Fill std=0 if we have single value
    std = series.rolling(window=w, min_periods=1).std()
    return std.fillna(0.0)


def ts_rank(series: pd.Series, window: int) -> pd.Series:
    """
    Rolling percentile rank of the current value within the window.
    Returns values scaled between 0.0 and 1.0.
    """
    w = _check_window(window)
    # rolling rank with pct=True returns rank relative to window size.
    # Safe from lookahead because it only looks at window history.
    return series.rolling(window=w, min_periods=1).rank(pct=True)


def zscore(series: pd.Series, window: int) -> pd.Series:
    """
    Rolling z-score: (x - mean) / std.
    Handles zero standard deviation safely.
    """
    w = _check_window(window)
    mean = ts_mean(series, w)
    std = ts_std(series, w)

    # Avoid division by zero
    z = (series - mean) / std
    z = z.replace([np.inf, -np.inf], np.nan)
    return z.fillna(0.0)


def momentum(series: pd.Series, window: int) -> pd.Series:
    """
    Momentum defined as simple pct change over a window: series / series.shift(window) - 1.
    """
    w = _check_window(window)
    # pct_change is safe from lookahead
    mom = series.pct_change(periods=w)
    mom = mom.replace([np.inf, -np.inf], np.nan)
    return mom.fillna(0.0)


def delta(series: pd.Series, window: int) -> pd.Series:
    """
    Difference between current value and value 'window' steps back: series - series.shift(window).
    """
    w = _check_window(window)
    return series.diff(periods=w)


def delay(series: pd.Series, window: int) -> pd.Series:
    """
    Value shifted by window steps: series.shift(window).
    """
    w = _check_window(window)
    return series.shift(periods=w)


def rank(series: pd.Series) -> pd.Series:
    """
    Expanding/rolling percentile rank to avoid lookahead bias.
    Implemented as rolling rank with window=252.
    """
    return ts_rank(series, 252)
