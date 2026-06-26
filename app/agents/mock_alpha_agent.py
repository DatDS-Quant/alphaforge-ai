from app.agents.schemas import AlphaIdea


class MockAlphaAgent:
    """
    A deterministic, rule-based mock quantitative AI agent.
    Maps natural-language intent keywords to clean math formulas.
    Does not give actual investment advice or claim real-market profitability.
    """

    def __init__(self):
        pass

    def generate_alpha_idea(self, user_prompt: str, preferred_style: str = "balanced") -> AlphaIdea:
        """
        Generate a structured AlphaIdea proposal from a user prompt using deterministic keyword priorities.
        """
        prompt_lower = user_prompt.lower()

        # Keywords for theme classification
        vol_keywords = ["volume", "liquidity", "abnormal volume", "participation"]
        volat_keywords = ["volatility", "stable", "risk adjusted", "noisy", "low risk"]
        reversion_keywords = ["mean reversion", "reversal", "oversold", "overbought", "revert"]
        mom_keywords = ["momentum", "trend", "breakout", "follow trend", "strength"]

        # Selection logic based on prompt priority
        if any(kw in prompt_lower for kw in vol_keywords):
            title = "Volume-Confirmed Momentum Alpha"
            hypothesis = "Strong price momentum is more persistent when backed by abnormal trading volume participation."
            formula = "zscore(volume, 60) * rank(momentum(close, 20))"
            required_columns = ["close", "volume"]
            expected_behavior = "Goes long when momentum is positive and supported by positive volume deviation; flat or short otherwise."
            risk_notes = [
                "Trading volume spikes can be triggered by short-term noise or singular large blocks.",
                "Potential execution cost increases due to high signal turnover.",
            ]
            explanation = "Calculates the 20-day momentum percentile rank and multiplies it by the 60-day volume z-score to weight momentum by relative participation intensity."
            tags = ["volume", "momentum", "trend"]

        elif any(kw in prompt_lower for kw in volat_keywords):
            title = "Volatility-Adjusted Momentum Alpha"
            hypothesis = "Asset momentum is more reliable when adjusted downward in regimes of high price volatility."
            formula = "rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60)"
            required_columns = ["close"]
            expected_behavior = "Maintains long exposures during smooth trending periods, scaling down exposure during high volatility spikes."
            risk_notes = [
                "Subject to lag in detecting sudden volatility regime changes.",
                "Underperforms in choppy, sideways markets with frequent volatility fluctuations.",
            ]
            explanation = "Computes 20-day price momentum percentile rank and penalizes it by subtracting the 60-day z-score of rolling 20-day price volatility."
            tags = ["momentum", "volatility", "risk-adjusted"]

        elif any(kw in prompt_lower for kw in reversion_keywords):
            title = "Short-Term Mean Reversion Alpha"
            hypothesis = "Extreme short-term deviations in asset price relative to rolling historical averages will revert back to the mean."
            formula = "-zscore(close, 20)"
            required_columns = ["close"]
            expected_behavior = "Goes short when prices are significantly above their 20-day mean, and long when below."
            risk_notes = [
                "Vulnerable to long-lasting trend breakouts where prices do not revert.",
                "Does not account for fundamental shifts or news events affecting valuation.",
            ]
            explanation = "Computes the z-score of closing prices relative to their rolling 20-day mean, then negates it to trigger mean-reverting signals."
            tags = ["mean-reversion", "zscore", "reversal"]

        elif any(kw in prompt_lower for kw in mom_keywords):
            title = "Basic Trend Momentum Alpha"
            hypothesis = "Assets that have outperformed over the past month tend to continue outperforming in the short term."
            formula = "rank(momentum(close, 20))"
            required_columns = ["close"]
            expected_behavior = "Maintains long positions on top momentum assets and short or flat on underperforming ones."
            risk_notes = [
                "Prone to sharp drawdowns during sudden market trend reversals.",
                "Sensitive to the choice of the 20-day rolling lookback window size.",
            ]
            explanation = (
                "Ranks the 20-day momentum of closing prices relative to historical benchmarks."
            )
            tags = ["momentum", "trend", "breakout"]

        else:
            title = "Default Trend Momentum Alpha"
            hypothesis = "Standard baseline asset momentum continues to persist over a rolling 20-day lookback window."
            formula = "rank(momentum(close, 20))"
            required_columns = ["close"]
            expected_behavior = "Long positions in assets displaying positive momentum over the historical lookback period."
            risk_notes = ["Susceptible to drawdowns during major macro trend inflection points."]
            explanation = (
                "Baseline default formula evaluating 20-day price momentum percentile ranking."
            )
            tags = ["momentum", "trend", "default"]

        # Slight adjustment based on style (tonal only, doesn't change math)
        if preferred_style == "conservative":
            explanation += (
                " (Presented under a risk-averse framework with conservative parameter selection.)"
            )
        elif preferred_style == "aggressive":
            explanation += (
                " (Presented under an active trading framework focusing on return maximization.)"
            )

        return AlphaIdea(
            title=title,
            hypothesis=hypothesis,
            formula=formula,
            required_columns=required_columns,
            expected_behavior=expected_behavior,
            risk_notes=risk_notes,
            explanation=explanation,
            tags=tags,
        )
