import pandas as pd

from app.core.backtester.signal import generate_signals


def run_backtest(
    df: pd.DataFrame,
    alpha: pd.Series,
    mode: str = "long_short",
    upper_quantile: float = 0.7,
    lower_quantile: float = 0.3,
    transaction_cost: float = 0.0005,
    slippage: float = 0.0005,
    min_periods: int = 30,
) -> pd.DataFrame:
    """
    Run a vectorized backtest on the input DataFrame using alpha signals.
    Avoids lookahead bias by shifting positions by 1 period.
    """
    # Ensure we don't modify the input DataFrame
    results = df.copy()
    results["alpha"] = alpha

    # Generate signals
    results["signal"] = generate_signals(
        alpha=alpha,
        mode=mode,
        upper_quantile=upper_quantile,
        lower_quantile=lower_quantile,
        min_periods=min_periods,
    )

    # Position held during day t is determined by the signal at the end of day t-1
    results["position"] = results["signal"].shift(1).fillna(0.0)

    # Calculate position changes (trades) to compute transaction costs and slippage
    # Position change at start of day t is position_t - position_{t-1}
    position_change = results["position"].diff().abs()
    # For the first day, we assume we transition from 0 to position_0
    if len(position_change) > 0:
        position_change.iloc[0] = abs(results["position"].iloc[0])

    # Transaction costs & slippage are charged when position changes
    total_cost_rate = transaction_cost + slippage
    trading_costs = position_change * total_cost_rate

    # Strategy return: position * asset return - trading costs
    results["strategy_return"] = results["position"] * results["return"] - trading_costs

    # Equity curve starting at 1.0
    results["equity_curve"] = (1.0 + results["strategy_return"]).cumprod()

    # Drawdown calculation
    cum_max = results["equity_curve"].cummax()
    results["drawdown"] = (results["equity_curve"] - cum_max) / cum_max

    # Trade indicator: signal changes
    results["trade"] = results["signal"].diff().fillna(results["signal"])

    # Clean up intermediate columns not requested in deliverables if necessary,
    # but keeping 'position' is helpful. Deliverables request:
    # date, close, return, alpha, signal, strategy_return, equity_curve, drawdown, trade
    requested_cols = [
        "date",
        "close",
        "return",
        "alpha",
        "signal",
        "strategy_return",
        "equity_curve",
        "drawdown",
        "trade",
    ]
    return results[requested_cols]
