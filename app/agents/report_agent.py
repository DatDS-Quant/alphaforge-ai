from app.agents.report_schemas import ResearchReport, ResearchReportInput


class ResearchReportAgent:
    """
    Agent that compiles a structured quantitative research report.
    It is fully local, template-based, and deterministic.
    """

    def __init__(self):
        pass

    def generate_report(self, input_data: ResearchReportInput) -> ResearchReport:
        """
        Generate a Markdown research memo based on the provided input data.
        """
        decision = input_data.risk_decision.get("decision", "REJECT")
        reasons = input_data.risk_decision.get("reasons", [])
        reasons_str = "\n".join([f"- {r}" for r in reasons])
        primary_reason = reasons[0] if reasons else "Passed basic checks."

        if decision == "REJECT":
            suggested_action = (
                "Do not promote this strategy. Investigate risk drivers, "
                "reduce turnover, and run robustness tests."
            )
            risk_review_text = (
                f"Status: REJECT\n"
                f"The strategy was rejected due to risk threshold breaches. "
                f"This strategy should not be promoted or pursued further without significant research "
                f"and modifications.\n\nReasons for rejection:\n{reasons_str}"
            )
        elif decision == "REDUCE":
            suggested_action = (
                "Use reduced sizing only under simplified assumptions and " "run robustness tests."
            )
            scale = input_data.risk_decision.get("recommended_position_scale", 0.5)
            risk_review_text = (
                f"Status: REDUCE\n"
                f"The strategy is approved with a reduced position size scale (scale factor: {scale}). "
                f"Caution is required because of specific parameter constraints, such as elevated turnover "
                f"or low risk-adjusted return.\n\nReasons for reduction:\n{reasons_str}"
            )
        else:  # APPROVE
            suggested_action = (
                "Approved only under simplified synthetic and vectorized assumptions. "
                "Validate further before any real-world use."
            )
            risk_review_text = (
                f"Status: APPROVE\n"
                f"The strategy has passed the basic risk filters. However, please note that this approval "
                f"is strictly within the boundaries of simplified research assumptions (vectorized execution, "
                f"daily bars, and no friction model). All parameters must be continually validated.\n\nFindings:\n{reasons_str}"
            )

        scope = "Local Vectorized Quantitative Simulation Research"

        # Performance summary formatting
        metrics = input_data.metrics
        perf_summary = (
            f"- Total Return: {metrics.get('total_return', 0.0) * 100:.2f}%\n"
            f"- Annualized Return: {metrics.get('annualized_return', 0.0) * 100:.2f}%\n"
            f"- Sharpe Ratio: {metrics.get('sharpe', 0.0):.2f}\n"
            f"- Sortino Ratio: {metrics.get('sortino', 0.0):.2f}\n"
            f"- Max Drawdown: {metrics.get('max_drawdown', 0.0) * 100:.2f}%\n"
            f"- Win Rate: {metrics.get('win_rate', 0.0) * 100:.2f}%\n"
            f"- Profit Factor: {metrics.get('profit_factor', 0.0):.2f}\n"
            f"- Daily Turnover: {metrics.get('turnover', 0.0):.4f}\n"
            f"- Number of Trades: {metrics.get('number_of_trades', 0)}"
        )

        limitations = [
            "Vectorized backtest assumes zero execution latency and perfect order queue execution.",
            "Synthetic data path follows random walk assumptions and does not reflect real-world market liquidity, news shocks, or spreads.",
        ]

        next_steps = [
            "Incorporate a database layer to track multi-asset experiment sets.",
            "Expand testing across multiple historical random walk path variations.",
            "Run cross-sectional evaluations using multiple assets.",
        ]

        limitations_str = "\n".join([f"- {lim}" for lim in limitations])
        next_steps_str = "\n".join([f"- {ns}" for ns in next_steps])

        # Main markdown text generation
        markdown_content = f"""# Research Memo: {input_data.title}

## Research Verdict
- **Decision**: {decision}
- **Primary Reason**: {primary_reason}
- **Suggested Action**: {suggested_action}
- **Scope**: {scope}

## Executive Summary
This report analyzes the quantitative backtest performance and risk profile of the formula expression `{input_data.formula}`. The evaluation is conducted entirely locally under deterministic conditions.

## Alpha Hypothesis
{input_data.hypothesis}

## Formula
`{input_data.formula}`

## Required Data
- **Required columns**: {", ".join(input_data.required_columns)}
- **Expected behavior**: {input_data.expected_behavior}

## Validation Result
- **Valid**: {input_data.validation.get("is_valid", False)}
- **Referenced columns**: {", ".join(input_data.validation.get("referenced_columns", []))}
- **Referenced operators**: {", ".join(input_data.validation.get("referenced_operators", []))}

## Backtest Configuration
- **Data path**: {input_data.backtest_config.get("data_path", "N/A")}
- **Signal mode**: {input_data.backtest_config.get("mode", "N/A")}
- **Upper quantile**: {input_data.backtest_config.get("upper_quantile", "N/A")}
- **Lower quantile**: {input_data.backtest_config.get("lower_quantile", "N/A")}
- **Transaction cost rate**: {input_data.backtest_config.get("transaction_cost", 0.0):.6f}
- **Slippage rate**: {input_data.backtest_config.get("slippage", 0.0):.6f}

## Performance Summary
{perf_summary}

## Risk Review
{risk_review_text}

## Key Limitations
{limitations_str}

## Suggested Next Experiments
{next_steps_str}

## Disclaimer
This report is generated for research and educational purposes only. It does not constitute investment, trading, or financial advice. Vectorized testing using synthetic data provides simplified simulations and does not represent real-market performance.
"""
        summary_text = f"Alpha Research Memo for '{input_data.title}'. Validation: {input_data.validation.get('is_valid', False)}. Risk Decision: {decision}."

        return ResearchReport(
            title=input_data.title,
            summary=summary_text,
            report_markdown=markdown_content.strip(),
            limitations=limitations,
            next_steps=next_steps,
        )
