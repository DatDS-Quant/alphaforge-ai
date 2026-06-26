import os

from fastapi import APIRouter, HTTPException, status

from app.agents.report_schemas import ExperimentArtifact, ResearchReport, ResearchReportInput
from app.agents.report_service import generate_research_report, save_research_experiment
from app.agents.schemas import AlphaIdeaRequest, AlphaIdeaResponse
from app.agents.service import generate_and_validate_alpha_idea
from app.api.schemas import (
    BacktestRequest,
    BacktestResponse,
    EvaluateAlphaRequest,
    EvaluateAlphaResponse,
    GenerateDataRequest,
    GenerateDataResponse,
    HealthResponse,
    RiskRequest,
    RiskResponse,
)
from app.core.backtester.engine import run_backtest
from app.core.expression_engine.evaluator import evaluate_expression
from app.core.expression_engine.validator import validate_expression
from app.core.metrics.performance import calculate_performance_metrics
from app.core.risk.rules import evaluate_risk
from app.data.loader import load_ohlcv
from app.data.sample_generator import generate_sample_data

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    """
    return HealthResponse()


@router.post("/data/generate", response_model=GenerateDataResponse)
def generate_data(payload: GenerateDataRequest):
    """
    Generate synthetic daily OHLCV data and write to disk.
    """
    try:
        # Create directory if it does not exist
        output_dir = os.path.dirname(payload.output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        df = generate_sample_data(days=payload.days, seed=payload.seed, scenario=payload.scenario)
        df.to_csv(payload.output_path, index=False)

        return GenerateDataResponse(
            message="Data generated successfully.",
            output_path=payload.output_path,
            row_count=len(df),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate data: {str(e)}",
        ) from e


@router.post("/alpha/evaluate", response_model=EvaluateAlphaResponse)
def evaluate_alpha(payload: EvaluateAlphaRequest):
    """
    Validate and evaluate an alpha formula.
    """
    # 1. Validate AST syntax and security rules first
    validation = validate_expression(payload.formula)

    if not validation.is_valid:
        return EvaluateAlphaResponse(
            is_valid=False,
            errors=validation.errors,
            warnings=validation.warnings,
            referenced_columns=validation.referenced_columns,
            referenced_operators=validation.referenced_operators,
            alpha_preview=None,
        )

    # 2. Check and load input data
    if not os.path.exists(payload.data_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data file not found at: {payload.data_path}. Please generate sample data first.",
        )

    try:
        df = load_ohlcv(payload.data_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error loading CSV data: {str(e)}"
        ) from e

    # 3. Evaluate expression
    try:
        alpha = evaluate_expression(payload.formula, df)
        # Generate a small preview list (first 10 items) as float, handling NaNs
        alpha_list = [
            float(x) if not (x is None or os.sys.float_info.max < abs(x)) else 0.0
            for x in alpha.fillna(0.0).tolist()
        ]
        alpha_preview = alpha_list[:10]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error evaluating formula: {str(e)}"
        ) from e

    return EvaluateAlphaResponse(
        is_valid=True,
        errors=[],
        warnings=validation.warnings,
        referenced_columns=validation.referenced_columns,
        referenced_operators=validation.referenced_operators,
        alpha_preview=alpha_preview,
    )


@router.post("/backtest/run", response_model=BacktestResponse)
def run_backtest_endpoint(payload: BacktestRequest):
    """
    Evaluate an alpha expression, run a vectorized backtest, and return performance metrics.
    """
    if not os.path.exists(payload.data_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Data file not found at: {payload.data_path}. Please generate sample data first.",
        )

    try:
        # Load and clean data
        df = load_ohlcv(payload.data_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error loading CSV data: {str(e)}"
        ) from e

    try:
        # Evaluate alpha
        alpha = evaluate_expression(payload.formula, df)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error evaluating formula: {str(e)}"
        ) from e

    try:
        # Run vectorized backtester
        bt_results = run_backtest(
            df=df,
            alpha=alpha,
            mode=payload.mode,
            upper_quantile=payload.upper_quantile,
            lower_quantile=payload.lower_quantile,
            transaction_cost=payload.transaction_cost,
            slippage=payload.slippage,
        )

        # Calculate performance metrics
        metrics = calculate_performance_metrics(bt_results)

        # Format returns for response
        dates_list = bt_results["date"].dt.strftime("%Y-%m-%d").tolist()
        equity_list = bt_results["equity_curve"].tolist()
        drawdown_list = bt_results["drawdown"].tolist()
        signals_list = bt_results["signal"].tolist()
        trades_list = bt_results["trade"].tolist()

        return BacktestResponse(
            metrics=metrics,
            dates=dates_list,
            equity_curve=equity_list,
            drawdown=drawdown_list,
            signals=signals_list,
            trades=trades_list,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing backtest: {str(e)}",
        ) from e


@router.post("/risk/evaluate", response_model=RiskResponse)
def evaluate_risk_endpoint(payload: RiskRequest):
    """
    Evaluate risk rules based on quantitative performance metrics.
    """
    try:
        risk_result = evaluate_risk(payload.metrics)

        # Calculate findings based on metrics for UI display
        max_dd = payload.metrics.get("max_drawdown", 0.0)
        num_trades = payload.metrics.get("number_of_trades", 0)
        sharpe = payload.metrics.get("sharpe", 0.0)
        turnover = payload.metrics.get("turnover", 0.0)

        max_dd_status = "FAIL" if max_dd < -0.25 else "PASS"
        trades_status = "FAIL" if num_trades < 5 else "PASS"
        sharpe_status = "CAUTION" if sharpe < 1.0 else "PASS"
        turnover_status = "CAUTION" if turnover > 0.6 else "PASS"

        rule_findings = {
            "max_drawdown": f"{max_dd_status} ({max_dd * 100:.1f}%)",
            "number_of_trades": f"{trades_status} ({num_trades} trades)",
            "sharpe": f"{sharpe_status} ({sharpe:.2f} Sharpe)",
            "turnover": f"{turnover_status} ({turnover * 100:.1f}%)",
        }

        return RiskResponse(
            decision=risk_result["decision"],
            reasons=risk_result["reasons"],
            recommended_position_scale=risk_result["recommended_position_scale"],
            recommended_scale=risk_result["recommended_position_scale"],
            disclaimer=risk_result["disclaimer"],
            rule_findings=rule_findings,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error evaluating risk rules: {str(e)}"
        ) from e


@router.post("/alpha/generate", response_model=AlphaIdeaResponse)
def generate_alpha_idea_endpoint(payload: AlphaIdeaRequest):
    """
    Generate and validate a quantitative alpha idea from a natural-language prompt.
    """
    if len(payload.user_prompt.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User prompt is too short. Minimum length is 3 characters.",
        )
    try:
        result = generate_and_validate_alpha_idea(
            user_prompt=payload.user_prompt,
            preferred_style=payload.preferred_style or "balanced",
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating alpha idea: {str(e)}",
        ) from e


@router.post("/report/generate", response_model=ResearchReport)
def generate_report_endpoint(payload: ResearchReportInput):
    """
    Generate a quantitative alpha research report.
    """
    try:
        return generate_research_report(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        ) from e


@router.post("/experiments/save", response_model=ExperimentArtifact)
def save_experiment_endpoint(payload: ResearchReportInput):
    """
    Save the research report and metadata as local experiment artifacts.
    """
    try:
        return save_research_experiment(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save experiment: {str(e)}",
        ) from e
