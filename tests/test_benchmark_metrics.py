import numpy as np
import pandas as pd

from app.core.backtester.engine import run_backtest
from app.core.metrics.performance import calculate_performance_metrics


def test_benchmark_metrics_calculation():
    """
    Verify benchmark equity curve calculation and metrics bounds.
    """
    # Create simple mock data
    dates = pd.date_range("2026-06-01", periods=10)
    df = pd.DataFrame(
        {
            "close": [10.0, 10.1, 10.2, 10.1, 10.3, 10.4, 10.5, 10.4, 10.3, 10.6],
            "return": [0.0, 0.01, 0.01, -0.01, 0.02, 0.01, 0.01, -0.01, -0.01, 0.029],
        },
        index=dates,
    )
    df.index.name = "date"
    df = df.reset_index()

    alpha = pd.Series([1.0, 2.0, 3.0, 2.0, 1.0, 2.0, 3.0, 2.0, 1.0, 0.0])

    bt_res = run_backtest(
        df=df, alpha=alpha, mode="long_short", upper_quantile=0.7, lower_quantile=0.3, min_periods=1
    )

    # Assert buy_hold_equity_curve exists and has standard properties
    assert "buy_hold_equity_curve" in bt_res.columns
    assert bt_res["buy_hold_equity_curve"].iloc[0] == 1.0

    metrics = calculate_performance_metrics(bt_res)

    # Assert metrics exist
    assert "buy_hold_total_return" in metrics
    assert "strategy_excess_return_vs_buy_hold" in metrics
    assert "strategy_correlation_to_asset_return" in metrics
    assert "exposure_ratio" in metrics

    # Assert bounds
    assert 0.0 <= metrics["exposure_ratio"] <= 1.0
    assert np.isfinite(metrics["strategy_excess_return_vs_buy_hold"])
    assert -1.0 <= metrics["strategy_correlation_to_asset_return"] <= 1.0


def test_correlation_zero_variance_safety():
    """
    Verify strategy_correlation_to_asset_return handles zero variance returns safely.
    """
    dates = pd.date_range("2026-06-01", periods=5)
    df = pd.DataFrame(
        {"close": [10.0, 10.0, 10.0, 10.0, 10.0], "return": [0.0, 0.0, 0.0, 0.0, 0.0]}, index=dates
    )
    df.index.name = "date"
    df = df.reset_index()

    # Strategy returns will also be zero
    alpha = pd.Series([1.0, 1.0, 1.0, 1.0, 1.0])
    bt_res = run_backtest(df=df, alpha=alpha, min_periods=1)

    metrics = calculate_performance_metrics(bt_res)
    assert metrics["strategy_correlation_to_asset_return"] == 0.0
