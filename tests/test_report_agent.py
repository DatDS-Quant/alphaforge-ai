import re

from app.agents.report_agent import ResearchReportAgent
from app.agents.report_schemas import ResearchReportInput


def get_base_input() -> ResearchReportInput:
    return ResearchReportInput(
        title="Test Alpha Strategy",
        hypothesis="Strategy performs well in high momentum regimes.",
        formula="rank(momentum(close, 20))",
        required_columns=["close"],
        expected_behavior="Positive values indicate long, negative indicate short.",
        risk_notes=["High volatility asset might lead to drawdown."],
        explanation="Calculates momentum over 20 period and ranks cross-sectionally.",
        validation={
            "is_valid": True,
            "referenced_columns": ["close"],
            "referenced_operators": ["rank", "momentum"],
        },
        metrics={
            "total_return": 0.15,
            "annualized_return": 0.12,
            "sharpe": 1.5,
            "sortino": 1.8,
            "max_drawdown": -0.08,
            "win_rate": 0.55,
            "profit_factor": 1.4,
            "turnover": 0.25,
            "number_of_trades": 22,
        },
        risk_decision={
            "decision": "APPROVE",
            "reasons": ["Passed all risk filters."],
            "recommended_position_scale": 1.0,
            "disclaimer": "This is not investment advice.",
        },
        backtest_config={
            "data_path": "data/sample_ohlcv.csv",
            "mode": "long_short",
            "upper_quantile": 0.7,
            "lower_quantile": 0.3,
            "transaction_cost": 0.0005,
            "slippage": 0.0005,
        },
    )


def test_report_agent_sections():
    """
    Verify report contains all required sections.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    report = agent.generate_report(input_data)

    sections = [
        "Executive Summary",
        "Alpha Hypothesis",
        "Formula",
        "Required Data",
        "Validation Result",
        "Backtest Configuration",
        "Performance Summary",
        "Risk Review",
        "Key Limitations",
        "Suggested Next Experiments",
        "Disclaimer",
    ]

    for section in sections:
        assert f"## {section}" in report.report_markdown


def test_report_rejected_caution():
    """
    Verify rejected strategy report contains a clear caution.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    input_data.risk_decision = {
        "decision": "REJECT",
        "reasons": ["Max Drawdown exceeded limits."],
        "recommended_position_scale": 0.0,
        "disclaimer": "This is not investment advice.",
    }
    report = agent.generate_report(input_data)
    assert "Status: REJECT" in report.report_markdown
    assert "should not be promoted or pursued further" in report.report_markdown


def test_report_approved_limitations():
    """
    Verify approved strategy report still contains limitations.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    report = agent.generate_report(input_data)
    assert "Status: APPROVE" in report.report_markdown
    assert (
        "strictly within the boundaries of simplified research assumptions"
        in report.report_markdown
    )
    assert (
        "synthetic data" in report.report_markdown.lower()
        or "vectorized" in report.report_markdown.lower()
    )


def test_report_no_icons_or_emojis():
    """
    Verify report contains no icons, emojis, or decorative Unicode-like symbols.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    report = agent.generate_report(input_data)

    # Emojis are outside standard ASCII ranges / basic Latin/punctuation ranges.
    # Let's ensure there are no emojis or emoji-like unicode characters.
    emoji_pattern = re.compile(
        "["
        "\U00010000-\U0010ffff"  # Supplemental planes (emojis, etc)
        "\u2600-\u27bf"  # Miscellaneous Symbols and Dingbats
        "\u2000-\u32ff"  # Various symbol blocks
        "]",
        flags=re.UNICODE,
    )
    assert not emoji_pattern.search(report.report_markdown)
    assert not emoji_pattern.search(report.summary)


def test_report_no_financial_advice_claims():
    """
    Verify report contains no financial advice claims.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    report = agent.generate_report(input_data)

    disclaimer_text = "does not constitute investment, trading, or financial advice"
    assert disclaimer_text in report.report_markdown.lower()


def test_report_determinism():
    """
    Verify report is deterministic for the same input.
    """
    agent = ResearchReportAgent()
    input_data_1 = get_base_input()
    input_data_2 = get_base_input()

    report_1 = agent.generate_report(input_data_1)
    report_2 = agent.generate_report(input_data_2)

    assert report_1.report_markdown == report_2.report_markdown
    assert report_1.summary == report_2.summary


def test_report_reduce_caution():
    """
    Verify reduced strategy report contains warnings and position scaling factor.
    """
    agent = ResearchReportAgent()
    input_data = get_base_input()
    input_data.risk_decision = {
        "decision": "REDUCE",
        "reasons": ["Turnover is slightly elevated."],
        "recommended_position_scale": 0.5,
        "disclaimer": "This is not investment advice.",
    }
    report = agent.generate_report(input_data)
    assert "Status: REDUCE" in report.report_markdown
    assert "scale factor: 0.5" in report.report_markdown
    assert "Turnover is slightly elevated." in report.report_markdown
