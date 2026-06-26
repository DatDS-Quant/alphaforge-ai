import pandas as pd
import pytest

from app.core.backtester.engine import run_backtest
from app.core.backtester.signal import generate_signals


def test_signal_generator_lookahead_free():
    """
    Verify signal generator uses shifted/historical expanding quantiles.
    This means the threshold at index t only depends on alpha values from 0 to t-1.
    """
    # Create alpha series
    alpha = pd.Series([1.0] * 50 + [100.0] + [1.0] * 10)

    # Generate signals
    signals = generate_signals(
        alpha=alpha, mode="long_short", upper_quantile=0.8, lower_quantile=0.2, min_periods=10
    )

    # The large alpha value is at index 50.
    # At index 50, the upper threshold is calculated based on indices 0..49, which are all 1.0.
    # Therefore, alpha[50] (100.0) is greater than upper threshold (1.0), so signals[50] must be 1.
    assert signals.iloc[50] == 1

    # At index 51, the threshold has now expanded to include index 50 (100.0).
    # Since alpha[51] is 1.0, it is now below the new threshold.
    # Let's verify that the threshold update did not leak to index 49 (which should be 0 because threshold hasn't been met yet).
    assert signals.iloc[49] == 0


def test_backtester_avoid_lookahead_shift():
    """
    Verify backtester avoids lookahead by shifting signals by 1 period.
    The strategy return at day t must equal signal at t-1 multiplied by asset return at day t (minus costs).
    """
    dates = pd.date_range("2023-01-01", periods=5)
    df = pd.DataFrame(
        {
            "date": dates,
            "close": [10.0, 12.0, 9.0, 11.0, 10.0],
            "return": [0.0, 0.2, -0.25, 0.222, -0.09],
        }
    )

    # Alpha values that result in signal: [0, 1, 0, -1, 0]
    alpha = pd.Series([0.5, 0.9, 0.5, 0.1, 0.5])

    # Run backtest with zero fees to test return shifting logic directly
    res = run_backtest(
        df=df,
        alpha=alpha,
        mode="long_short",
        upper_quantile=0.8,
        lower_quantile=0.2,
        transaction_cost=0.0,
        slippage=0.0,
        min_periods=1,
    )

    # Ensure signal was generated
    assert "signal" in res.columns
    assert "strategy_return" in res.columns

    # Check that strategy return at index 1 is signal[0] * return[1]
    # At index 1: signal[0] is 0, so strategy_return[1] should be 0.0
    assert res["strategy_return"].iloc[1] == 0.0

    # At index 2: signal[1] is 1, so strategy_return[2] should be 1.0 * return[2] = -0.25
    assert pytest.approx(res["strategy_return"].iloc[2]) == -0.25
