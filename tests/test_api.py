import os

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_health():
    """
    Verify health check endpoint returns 200 and healthy status.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_post_data_generate(tmp_path):
    """
    Verify data generation endpoint creates the CSV.
    """
    output_path = tmp_path / "test_api_ohlcv.csv"
    payload = {"days": 50, "seed": 42, "output_path": str(output_path)}
    response = client.post("/data/generate", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "generated" in res_json["message"].lower()
    assert res_json["row_count"] == 50
    assert os.path.exists(output_path)


def test_post_alpha_evaluate(tmp_path):
    """
    Verify alpha evaluation endpoint behavior under valid, invalid, and missing file inputs.
    """
    output_path = tmp_path / "test_api_ohlcv.csv"
    client.post("/data/generate", json={"days": 50, "seed": 42, "output_path": str(output_path)})

    # Valid formula
    payload = {"formula": "rank(momentum(close, 10))", "data_path": str(output_path)}
    response = client.post("/alpha/evaluate", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["is_valid"] is True
    assert len(res_json["alpha_preview"]) > 0

    # Invalid formula (rejected at AST validation or window checking level)
    payload_invalid = {"formula": "ts_mean(close, -5)", "data_path": str(output_path)}
    response = client.post("/alpha/evaluate", json=payload_invalid)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["is_valid"] is False
    assert len(res_json["errors"]) > 0

    # Missing file path
    payload_missing = {"formula": "close", "data_path": "nonexistent_file.csv"}
    response = client.post("/alpha/evaluate", json=payload_missing)
    assert response.status_code == 404


def test_post_backtest_run(tmp_path):
    """
    Verify backtesting runs cleanly, checks input boundaries, and handles exceptions safely.
    """
    output_path = tmp_path / "test_api_ohlcv.csv"
    client.post("/data/generate", json={"days": 50, "seed": 42, "output_path": str(output_path)})

    # Valid backtest
    payload = {
        "formula": "rank(momentum(close, 5))",
        "data_path": str(output_path),
        "mode": "long_short",
        "upper_quantile": 0.8,
        "lower_quantile": 0.2,
    }
    response = client.post("/backtest/run", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "metrics" in res_json
    assert "equity_curve" in res_json
    assert "drawdown" in res_json

    # Validate that no metrics contains NaN or Infinity values
    metrics = res_json["metrics"]
    for val in metrics.values():
        if isinstance(val, float):
            assert not (val != val or val == float("inf") or val == float("-inf"))

    # Invalid formula syntax
    payload["formula"] = "import os"
    response = client.post("/backtest/run", json=payload)
    assert response.status_code == 400

    # Invalid signal mode (causes Pydantic validation error)
    payload["formula"] = "close"
    payload["mode"] = "invalid_mode_name"
    response = client.post("/backtest/run", json=payload)
    assert response.status_code == 422


def test_post_risk_evaluate():
    """
    Verify post-backtest risk evaluation route.
    """
    payload = {
        "metrics": {
            "max_drawdown": -0.10,
            "number_of_trades": 10,
            "sharpe": 1.5,
            "total_return": 0.20,
            "turnover": 0.20,
        }
    }
    response = client.post("/risk/evaluate", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["decision"] == "APPROVE"
    assert len(res_json["reasons"]) > 0


def test_post_alpha_generate():
    """
    Verify the AI generation endpoint works for a valid prompt and rejects empty inputs.
    """
    # Valid volume-themed prompt
    payload = {
        "user_prompt": "Find a momentum alpha confirmed by abnormal volume",
        "preferred_style": "balanced",
    }
    response = client.post("/alpha/generate", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "idea" in res_json
    assert res_json["idea"]["formula"] == "zscore(volume, 60) * rank(momentum(close, 20))"
    assert res_json["validation"]["is_valid"] is True
    assert len(res_json["warnings"]) > 0

    # Short prompt (rejected by router custom length check)
    payload_short = {"user_prompt": "ab"}
    response = client.post("/alpha/generate", json=payload_short)
    assert response.status_code == 400 or response.status_code == 422


def test_post_report_generate_and_save(tmp_path, monkeypatch):
    """
    Verify report generation and saving endpoints, checking for validation errors
    and ensuring responses are formatted correctly without NaN/inf.
    """
    # 1. Base input payload
    payload = {
        "title": "API Test Alpha",
        "hypothesis": "Test Hypothesis",
        "formula": "rank(momentum(close, 10))",
        "required_columns": ["close"],
        "expected_behavior": "Up is good",
        "risk_notes": ["No risk notes"],
        "explanation": "No explanation",
        "validation": {
            "is_valid": True,
            "referenced_columns": ["close"],
            "referenced_operators": [],
        },
        "metrics": {"total_return": 0.05, "sharpe": 1.2, "number_of_trades": 10},
        "risk_decision": {"decision": "APPROVE", "reasons": ["Good"]},
        "backtest_config": {"data_path": "data/sample_ohlcv.csv"},
    }

    # Test POST /report/generate
    response = client.post("/report/generate", json=payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "title" in res_json
    assert res_json["title"] == "API Test Alpha"
    assert "## Executive Summary" in res_json["report_markdown"]

    # Redirect saving to a temp directory using monkeypatch
    temp_dir = tmp_path / "experiments_api_test"
    import app.api.routes

    original_save = app.api.routes.save_research_experiment

    def mock_save(input_data):
        return original_save(input_data, output_dir=str(temp_dir))

    monkeypatch.setattr(app.api.routes, "save_research_experiment", mock_save)

    # Test POST /experiments/save
    response_save = client.post("/experiments/save", json=payload)
    assert response_save.status_code == 200
    res_save_json = response_save.json()
    assert "experiment_id" in res_save_json
    assert "report_path" in res_save_json

    # Assert files are created in the temp directory
    assert os.path.exists(res_save_json["report_path"])
    assert os.path.exists(res_save_json["metadata_path"])

    # Test Validation Error
    payload_invalid = payload.copy()
    del payload_invalid["formula"]  # Missing required field
    response_err = client.post("/report/generate", json=payload_invalid)
    assert response_err.status_code == 422


def test_report_generate_manual_formula_reject_without_profitability_claim():
    """
    Manual formula mode should generate a memo without a generated idea and still support REJECT decisions.
    """
    payload = {
        "title": "Manual Formula Research Memo",
        "hypothesis": "This memo evaluates a manually supplied single-asset alpha signal formula under the current synthetic research configuration.",
        "formula": "rank(momentum(close, 20))",
        "required_columns": ["close"],
        "expected_behavior": "The signal behavior is inferred from the validated formula and evaluated through vectorized backtesting.",
        "risk_notes": [
            "This memo was generated from a manual formula without a prior generated research idea.",
            "Results are synthetic research outputs, not real-market evidence.",
        ],
        "explanation": "No generated research explanation is available because the workflow started from a manual formula.",
        "validation": {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "referenced_columns": ["close"],
            "referenced_operators": ["rank", "momentum"],
        },
        "metrics": {
            "total_return": -0.08,
            "annualized_return": -0.04,
            "sharpe": -0.3,
            "sortino": -0.2,
            "max_drawdown": -0.32,
            "win_rate": 0.42,
            "profit_factor": 0.7,
            "turnover": 0.8,
            "number_of_trades": 12,
        },
        "risk_decision": {
            "decision": "REJECT",
            "reasons": ["Max drawdown breached limit."],
            "recommended_position_scale": 0.0,
            "recommended_scale": 0.0,
        },
        "backtest_config": {
            "data_path": "data/sample_ohlcv.csv",
            "mode": "long_short",
            "upper_quantile": 0.7,
            "lower_quantile": 0.3,
            "transaction_cost": 0.0005,
            "slippage": 0.0005,
        },
    }

    response = client.post("/report/generate", json=payload)
    assert response.status_code == 200
    report = response.json()["report_markdown"]
    assert "Manual Formula Research Memo" in report
    assert "**Decision**: REJECT" in report
    assert "Do not promote this strategy" in report
    lower_report = report.lower()
    assert "guaranteed" not in lower_report
    assert "real-market performance" in lower_report
