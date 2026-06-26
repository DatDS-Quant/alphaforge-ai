import json
import os

from app.agents.artifact_store import create_experiment_id, save_experiment_artifacts
from app.agents.report_schemas import ResearchReport, ResearchReportInput


def get_base_input() -> ResearchReportInput:
    return ResearchReportInput(
        title="My Custom Alpha Strategy!",
        hypothesis="Testing formula robustness.",
        formula="rank(momentum(close, 20)) / ts_std(close, 20)",
        required_columns=["close"],
        expected_behavior="Positive values indicate long, negative indicate short.",
        risk_notes=["High volatility risks."],
        explanation="Custom manual formula.",
        validation={
            "is_valid": True,
            "referenced_columns": ["close"],
            "referenced_operators": ["rank", "momentum", "ts_std"],
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
            "equity_curve": [1.0, 1.01, 1.02, 1.05],  # huge curve simulation
            "drawdown": [0.0, 0.0, 0.0, 0.0],  # huge drawdown list simulation
        },
        risk_decision={
            "decision": "APPROVE",
            "reasons": ["Passed"],
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


def test_create_experiment_id():
    """
    Verify generated experiment ID is filesystem-safe and lowercase alphanumeric.
    """
    title = "My Custom Alpha Strategy!"
    formula = "rank(momentum(close, 20)) / ts_std(close, 20)"
    exp_id = create_experiment_id(title, formula)

    # Check lowercase alphanumeric with underscores
    assert exp_id.islower()
    assert "_" in exp_id
    # Ensure no special characters like ! / ( ) or space
    assert not any(c in exp_id for c in ["!", "/", "(", ")", " ", "\\"])
    assert len(exp_id) <= 64


def test_save_experiment_artifacts(tmp_path):
    """
    Verify saves markdown report, metadata JSON, returns relative paths,
    contains necessary metadata, and strips huge equity curves/drawdowns.
    """
    input_data = get_base_input()
    report = ResearchReport(
        title=input_data.title,
        summary="A summary",
        report_markdown="# Test Report",
        limitations=["Limitation 1"],
        next_steps=["Step 1"],
    )

    # Use temporary directory for testing
    output_dir = tmp_path / "experiments"

    artifact = save_experiment_artifacts(
        report=report,
        input_data=input_data,
        output_dir=str(output_dir),
        created_at="2026-06-26T12:00:00Z",
    )

    # Verify relative paths or paths written to correct directory
    assert artifact.experiment_id == create_experiment_id(input_data.title, input_data.formula)
    assert os.path.exists(artifact.report_path)
    assert os.path.exists(artifact.metadata_path)

    # Verify metadata JSON contents
    with open(artifact.metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    assert metadata["experiment_id"] == artifact.experiment_id
    assert metadata["formula"] == input_data.formula
    assert metadata["created_at"] == "2026-06-26T12:00:00Z"
    assert metadata["limitations"] == report.limitations
    assert metadata["next_steps"] == report.next_steps
    assert metadata["risk_decision"]["decision"] == "APPROVE"

    # Ensure huge metrics arrays were stripped
    assert "equity_curve" not in metadata["metrics"]
    assert "drawdown" not in metadata["metrics"]
    # Verify other metrics are still present
    assert metadata["metrics"]["sharpe"] == 1.5
    assert metadata["metrics"]["total_return"] == 0.15
