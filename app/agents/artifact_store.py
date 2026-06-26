import json
import os
import re
from datetime import datetime, timezone

from app.agents.report_schemas import ExperimentArtifact, ResearchReport, ResearchReportInput


def create_experiment_id(title: str, formula: str) -> str:
    """
    Generate a deterministic, filesystem-safe experiment ID from the title and formula.
    """
    safe_title = re.sub(r"[^a-zA-Z0-9]", "_", title.lower())
    safe_formula = re.sub(r"[^a-zA-Z0-9]", "_", formula.lower())

    # Clean multiple underscores and trailing ones
    safe_title = re.sub(r"_+", "_", safe_title).strip("_")
    safe_formula = re.sub(r"_+", "_", safe_formula).strip("_")

    exp_id = f"{safe_title}_{safe_formula}"
    # Keep ID length bounded and clean
    return exp_id[:64]


def save_experiment_artifacts(
    report: ResearchReport,
    input_data: ResearchReportInput,
    output_dir: str = "reports/experiments",
    created_at: str = None,
) -> ExperimentArtifact:
    """
    Save the research report markdown content and metadata summary as local files.
    Returns the ExperimentArtifact holding relative paths.
    """
    # Normalize paths to use relative directory offsets
    os.makedirs(output_dir, exist_ok=True)

    experiment_id = create_experiment_id(input_data.title, input_data.formula)

    if created_at is None:
        created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    report_filename = f"{experiment_id}_report.md"
    metadata_filename = f"{experiment_id}_metadata.json"

    report_path = os.path.join(output_dir, report_filename).replace("\\", "/")
    metadata_path = os.path.join(output_dir, metadata_filename).replace("\\", "/")

    # Save Markdown report
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report.report_markdown)

    # Build metadata, strip any oversized collections (curves/signals) if present in raw metrics
    clean_metrics = input_data.metrics.copy()
    if "equity_curve" in clean_metrics:
        del clean_metrics["equity_curve"]
    if "drawdown" in clean_metrics:
        del clean_metrics["drawdown"]

    metadata = {
        "experiment_id": experiment_id,
        "created_at": created_at,
        "title": input_data.title,
        "hypothesis": input_data.hypothesis,
        "formula": input_data.formula,
        "required_columns": input_data.required_columns,
        "validation": input_data.validation,
        "metrics": clean_metrics,
        "risk_decision": input_data.risk_decision,
        "backtest_config": input_data.backtest_config,
        "limitations": report.limitations,
        "next_steps": report.next_steps,
    }

    # Save Metadata JSON
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)

    return ExperimentArtifact(
        experiment_id=experiment_id,
        report_path=report_path,
        metadata_path=metadata_path,
        created_at=created_at,
    )
