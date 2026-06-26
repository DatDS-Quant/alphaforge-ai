from typing import Any, Dict

import numpy as np
import pandas as pd


def calculate_performance_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate quantitative performance metrics for a backtested strategy.
    Handles empty inputs and zero-volatility situations safely.
    All returned values are JSON-serializable floats or ints (no NaN/inf).
    """
    metrics = {
        "total_return": 0.0,
        "annualized_return": 0.0,
        "sharpe": 0.0,
        "sortino": 0.0,
        "max_drawdown": 0.0,
        "win_rate": 0.0,
        "profit_factor": 0.0,
        "turnover": 0.0,
        "number_of_trades": 0,
        "buy_hold_total_return": 0.0,
        "strategy_excess_return_vs_buy_hold": 0.0,
        "strategy_correlation_to_asset_return": 0.0,
        "exposure_ratio": 0.0,
    }

    if df.empty or "strategy_return" not in df.columns:
        return metrics

    returns = df["strategy_return"]
    n_days = len(returns)

    if n_days == 0:
        return metrics

    # 1. Total Return
    if "equity_curve" in df.columns and len(df["equity_curve"]) > 0:
        total_ret = df["equity_curve"].iloc[-1] - 1.0
    else:
        total_ret = (1.0 + returns).prod() - 1.0
    metrics["total_return"] = float(total_ret)

    # 2. Annualized Return
    if n_days > 0 and total_ret > -1.0:
        ann_ret = (total_ret + 1.0) ** (252.0 / n_days) - 1.0
        metrics["annualized_return"] = float(ann_ret)
    else:
        metrics["annualized_return"] = -1.0

    # 3. Sharpe Ratio
    ret_std = returns.std(ddof=1)
    if ret_std > 0 and not pd.isna(ret_std):
        sharpe = (returns.mean() / ret_std) * np.sqrt(252.0)
        metrics["sharpe"] = float(sharpe)
    else:
        metrics["sharpe"] = 0.0

    # 4. Sortino Ratio
    downside_returns = returns.copy()
    downside_returns[downside_returns > 0.0] = 0.0
    downside_std = downside_returns.std(ddof=1)
    if downside_std > 0 and not pd.isna(downside_std):
        sortino = (returns.mean() / downside_std) * np.sqrt(252.0)
        metrics["sortino"] = float(sortino)
    else:
        metrics["sortino"] = 0.0

    # 5. Max Drawdown
    if "drawdown" in df.columns and len(df["drawdown"]) > 0:
        max_dd = df["drawdown"].min()
        metrics["max_drawdown"] = float(max_dd)
    else:
        metrics["max_drawdown"] = 0.0

    # 6. Win Rate (percentage of days with positive return)
    win_days = (returns > 0.0).sum()
    metrics["win_rate"] = float(win_days / n_days)

    # 7. Profit Factor (gross profit / gross loss)
    gross_profit = returns[returns > 0.0].sum()
    gross_loss = abs(returns[returns < 0.0].sum())
    if gross_loss == 0.0:
        metrics["profit_factor"] = float(gross_profit) if gross_profit > 0.0 else 0.0
    else:
        metrics["profit_factor"] = float(gross_profit / gross_loss)

    # 8. Turnover (average daily signal absolute change)
    if "signal" in df.columns and len(df["signal"]) > 1:
        metrics["turnover"] = float(df["signal"].diff().abs().mean())
    else:
        metrics["turnover"] = 0.0

    # 9. Number of Trades
    if "trade" in df.columns:
        metrics["number_of_trades"] = int((df["trade"] != 0.0).sum())
    else:
        metrics["number_of_trades"] = 0

    # 10. Benchmark Metrics
    # Buy & Hold Total Return
    bh_total = 0.0
    if "buy_hold_equity_curve" in df.columns and len(df["buy_hold_equity_curve"]) > 0:
        bh_total = float(df["buy_hold_equity_curve"].iloc[-1] - 1.0)
    elif "return" in df.columns and len(df) > 0:
        bh_total = float((1.0 + df["return"]).prod() - 1.0)
    metrics["buy_hold_total_return"] = bh_total

    # Excess Return vs Buy & Hold
    metrics["strategy_excess_return_vs_buy_hold"] = float(metrics["total_return"] - bh_total)

    # Strategy Correlation to Asset Return
    corr = 0.0
    if "strategy_return" in df.columns and "return" in df.columns:
        std1 = df["strategy_return"].std()
        std2 = df["return"].std()
        if std1 > 0.0 and std2 > 0.0:
            corr_val = df["strategy_return"].corr(df["return"])
            if not pd.isna(corr_val):
                corr = float(corr_val)
    metrics["strategy_correlation_to_asset_return"] = corr

    # Exposure Ratio
    exposure = 0.0
    if "signal" in df.columns and len(df) > 0:
        exposure = float((df["signal"].abs() > 0.0).sum() / len(df))
    metrics["exposure_ratio"] = exposure

    # Final safety check to replace any invalid float value with 0.0
    for key, val in metrics.items():
        if isinstance(val, float):
            if pd.isna(val) or np.isinf(val):
                metrics[key] = 0.0

    return metrics
