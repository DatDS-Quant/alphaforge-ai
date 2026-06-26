import pandas as pd

from app.core.metrics.performance import calculate_performance_metrics
from app.core.risk.rules import evaluate_risk


def test_metrics_zero_volatility():
    """
    Verify performance metrics can handle zero-volatility returns without dividing by zero or producing NaNs.
    """
    df = pd.DataFrame(
        {
            "strategy_return": [0.0] * 100,
            "equity_curve": [1.0] * 100,
            "drawdown": [0.0] * 100,
            "signal": [1] * 100,
            "trade": [0.0] * 100,
        }
    )

    metrics = calculate_performance_metrics(df)

    assert metrics["sharpe"] == 0.0
    assert metrics["sortino"] == 0.0
    assert metrics["total_return"] == 0.0
    assert metrics["max_drawdown"] == 0.0


def test_risk_rules():
    """
    Test risk evaluation decisions: APPROVE, REDUCE, REJECT.
    """
    # 1. Base case: Should Approve
    base_metrics = {
        "max_drawdown": -0.10,
        "number_of_trades": 10,
        "sharpe": 1.5,
        "total_return": 0.20,
        "turnover": 0.20,
    }
    res = evaluate_risk(base_metrics)
    assert res["decision"] == "APPROVE"
    assert res["recommended_position_scale"] == 1.0

    # 2. Reject: Max drawdown worse than -25%
    bad_drawdown = base_metrics.copy()
    bad_drawdown["max_drawdown"] = -0.30
    res = evaluate_risk(bad_drawdown)
    assert res["decision"] == "REJECT"
    assert res["recommended_position_scale"] == 0.0

    # 3. Reject: Number of trades less than 5
    few_trades = base_metrics.copy()
    few_trades["number_of_trades"] = 3
    res = evaluate_risk(few_trades)
    assert res["decision"] == "REJECT"
    assert res["recommended_position_scale"] == 0.0

    # 4. Reduce: Sharpe < 1.0 but total return > 0
    low_sharpe = base_metrics.copy()
    low_sharpe["sharpe"] = 0.5
    res = evaluate_risk(low_sharpe)
    assert res["decision"] == "REDUCE"
    assert res["recommended_position_scale"] == 0.5

    # 5. Reduce: Turnover > 0.6
    high_turnover = base_metrics.copy()
    high_turnover["turnover"] = 0.7
    res = evaluate_risk(high_turnover)
    assert res["decision"] == "REDUCE"
    assert res["recommended_position_scale"] == 0.5
