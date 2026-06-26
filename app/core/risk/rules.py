from typing import Any, Dict


def evaluate_risk(metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate risk rules based on quantitative performance metrics.
    Returns a dictionary containing the decision, list of reasons,
    recommended position scale, and a disclaimer.
    """
    decision = "APPROVE"
    reasons = []
    recommended_position_scale = 1.0

    max_dd = metrics.get("max_drawdown", 0.0)
    num_trades = metrics.get("number_of_trades", 0)
    sharpe = metrics.get("sharpe", 0.0)
    total_ret = metrics.get("total_return", 0.0)
    turnover = metrics.get("turnover", 0.0)

    # 1. Rejection Rules (High Priority)
    # Reject if max drawdown is worse than -25%
    if max_dd < -0.25:
        decision = "REJECT"
        reasons.append(f"Max drawdown exceeds limit of -25.0% (got: {max_dd * 100:.2f}%)")

    # Reject if number of trades is less than 5
    if num_trades < 5:
        decision = "REJECT"
        reasons.append(f"Number of trades is below minimum of 5 (got: {num_trades})")

    # 2. Reduction Rules (Medium Priority, only checked if not rejected)
    if decision != "REJECT":
        # Reduce if Sharpe is less than 1.0 but total return is positive
        if sharpe < 1.0 and total_ret > 0.0:
            decision = "REDUCE"
            recommended_position_scale = min(recommended_position_scale, 0.5)
            reasons.append(
                f"Sharpe ratio is low (< 1.0) with positive returns (got Sharpe: {sharpe:.2f})"
            )

        # Reduce if turnover is greater than 60% (0.6)
        if turnover > 0.6:
            decision = "REDUCE"
            recommended_position_scale = min(recommended_position_scale, 0.5)
            reasons.append(f"Turnover is excessively high (> 0.6) (got: {turnover:.2f})")

    # Adjust scale to 0.0 if rejected
    if decision == "REJECT":
        recommended_position_scale = 0.0

    if not reasons:
        reasons.append("All basic risk rules passed.")

    return {
        "decision": decision,
        "reasons": reasons,
        "recommended_position_scale": recommended_position_scale,
        "disclaimer": "This is not investment advice.",
    }
