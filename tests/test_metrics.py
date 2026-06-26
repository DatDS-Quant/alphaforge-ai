import pandas as pd
import pytest

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

    # 6. Override check: If both REJECT and REDUCE trigger, REJECT must override REDUCE
    override_metrics = base_metrics.copy()
    override_metrics["max_drawdown"] = -0.30  # REJECT trigger
    override_metrics["turnover"] = 0.7  # REDUCE trigger
    res = evaluate_risk(override_metrics)
    assert res["decision"] == "REJECT"
    assert res["recommended_position_scale"] == 0.0

    # 7. Scale range bounds check for all evaluations
    all_cases = [
        base_metrics,
        bad_drawdown,
        few_trades,
        low_sharpe,
        high_turnover,
        override_metrics,
    ]
    for case in all_cases:
        res = evaluate_risk(case)
        scale = res["recommended_position_scale"]
        assert 0.0 <= scale <= 1.0


def test_metrics_hardening():
    """
    Test performance metrics under extreme edge cases: empty data, all positive,
    all negative, single trade, and no trade.
    """
    # 1. Empty dataframe
    empty_df = pd.DataFrame()
    m_empty = calculate_performance_metrics(empty_df)
    assert m_empty["total_return"] == 0.0
    assert m_empty["sharpe"] == 0.0
    assert m_empty["sortino"] == 0.0
    assert m_empty["profit_factor"] == 0.0
    assert m_empty["number_of_trades"] == 0

    # 2. All positive returns (no loss, no downside sortino case)
    pos_df = pd.DataFrame(
        {
            "strategy_return": [0.01] * 10,
            "equity_curve": [1.0 + 0.01 * i for i in range(1, 11)],
            "drawdown": [0.0] * 10,
            "signal": [1] * 10,
            "trade": [0.0] * 10,
        }
    )
    m_pos = calculate_performance_metrics(pos_df)
    assert m_pos["profit_factor"] == pytest.approx(0.1)  # gross profit sum
    assert m_pos["sortino"] == 0.0  # no downside std

    # 3. All negative returns (no win)
    neg_df = pd.DataFrame(
        {
            "strategy_return": [-0.01] * 10,
            "equity_curve": [1.0 - 0.01 * i for i in range(1, 11)],
            "drawdown": [-0.01 * i for i in range(1, 11)],
            "signal": [1] * 10,
            "trade": [0.0] * 10,
        }
    )
    m_neg = calculate_performance_metrics(neg_df)
    assert m_neg["profit_factor"] == 0.0
    assert m_neg["sortino"] != 0.0

    # 4. One-trade case
    one_trade_df = pd.DataFrame(
        {
            "strategy_return": [0.0] * 10,
            "equity_curve": [1.0] * 10,
            "drawdown": [0.0] * 10,
            "signal": [0] * 9 + [1],
            "trade": [0.0] * 9 + [1.0],
        }
    )
    m_one = calculate_performance_metrics(one_trade_df)
    assert m_one["number_of_trades"] == 1

    # 5. No-trade case
    no_trade_df = pd.DataFrame(
        {
            "strategy_return": [0.0] * 10,
            "equity_curve": [1.0] * 10,
            "drawdown": [0.0] * 10,
            "signal": [0] * 10,
            "trade": [0.0] * 10,
        }
    )
    m_none = calculate_performance_metrics(no_trade_df)
    assert m_none["number_of_trades"] == 0
