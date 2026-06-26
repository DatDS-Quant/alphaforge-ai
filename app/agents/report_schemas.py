from typing import Any, Dict, List

from pydantic import BaseModel, Field


class ResearchReportInput(BaseModel):
    title: str = Field(..., description="Title of the alpha idea.")
    hypothesis: str = Field(..., description="Hypothesis of the alpha idea.")
    formula: str = Field(..., description="Alpha mathematical formula.")
    required_columns: List[str] = Field(..., description="Required columns from the dataset.")
    expected_behavior: str = Field(..., description="Expected behavior of the alpha strategy.")
    risk_notes: List[str] = Field(..., description="Notes regarding risks.")
    explanation: str = Field(..., description="Explanation of formula logic.")
    validation: Dict[str, Any] = Field(..., description="Validation results dictionary.")
    metrics: Dict[str, Any] = Field(..., description="Quantitative backtest performance metrics.")
    risk_decision: Dict[str, Any] = Field(..., description="Risk evaluation output.")
    backtest_config: Dict[str, Any] = Field(..., description="Backtest configuration parameters.")


class ResearchReport(BaseModel):
    title: str = Field(..., description="Title of the report.")
    summary: str = Field(..., description="Executive summary of the alpha research.")
    report_markdown: str = Field(
        ..., description="The template-generated report content in Markdown."
    )
    limitations: List[str] = Field(..., description="List of strategy and platform limitations.")
    next_steps: List[str] = Field(..., description="List of proposed next steps for research.")


class ExperimentArtifact(BaseModel):
    experiment_id: str = Field(
        ..., description="Unique filesystem-safe identifier of the experiment."
    )
    report_path: str = Field(..., description="Relative file path to the saved markdown report.")
    metadata_path: str = Field(..., description="Relative file path to the saved metadata JSON.")
    created_at: str = Field(..., description="ISO timestamp of when the artifact was written.")
