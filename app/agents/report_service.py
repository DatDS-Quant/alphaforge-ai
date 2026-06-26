import math
from typing import Any

from app.agents.artifact_store import save_experiment_artifacts
from app.agents.report_agent import ResearchReportAgent
from app.agents.report_schemas import ExperimentArtifact, ResearchReport, ResearchReportInput


def sanitize_val(val: Any) -> Any:
    """
    Recursively replace NaN and inf floats with 0.0 or standard representations.
    """
    if isinstance(val, dict):
        return {k: sanitize_val(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_val(v) for v in val]
    elif isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return val
    return val


def generate_research_report(input_data: ResearchReportInput) -> ResearchReport:
    """
    Generate a research report using the ResearchReportAgent.
    """
    # Sanitize input data to remove any NaNs or infinities
    sanitized_data = ResearchReportInput(
        title=input_data.title,
        hypothesis=input_data.hypothesis,
        formula=input_data.formula,
        required_columns=input_data.required_columns,
        expected_behavior=input_data.expected_behavior,
        risk_notes=input_data.risk_notes,
        explanation=input_data.explanation,
        validation=sanitize_val(input_data.validation),
        metrics=sanitize_val(input_data.metrics),
        risk_decision=sanitize_val(input_data.risk_decision),
        backtest_config=sanitize_val(input_data.backtest_config),
    )
    agent = ResearchReportAgent()
    return agent.generate_report(sanitized_data)


def save_research_experiment(
    input_data: ResearchReportInput, output_dir: str = "reports/experiments"
) -> ExperimentArtifact:
    """
    Generate the report and save the experiment artifacts locally.
    """
    # Sanitize input data first
    sanitized_data = ResearchReportInput(
        title=input_data.title,
        hypothesis=input_data.hypothesis,
        formula=input_data.formula,
        required_columns=input_data.required_columns,
        expected_behavior=input_data.expected_behavior,
        risk_notes=input_data.risk_notes,
        explanation=input_data.explanation,
        validation=sanitize_val(input_data.validation),
        metrics=sanitize_val(input_data.metrics),
        risk_decision=sanitize_val(input_data.risk_decision),
        backtest_config=sanitize_val(input_data.backtest_config),
    )
    report = generate_research_report(sanitized_data)
    return save_experiment_artifacts(report, sanitized_data, output_dir)
