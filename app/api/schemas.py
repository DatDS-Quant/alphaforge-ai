from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"


class GenerateDataRequest(BaseModel):
    days: int = Field(default=1000, description="Number of daily candles to generate.")
    seed: int = Field(default=42, description="Random seed for reproducibility.")
    output_path: str = Field(default="data/sample_ohlcv.csv", description="Output CSV file path.")


class GenerateDataResponse(BaseModel):
    message: str
    output_path: str
    row_count: int


class EvaluateAlphaRequest(BaseModel):
    formula: str = Field(
        ..., description="Alpha formula to validate and evaluate, e.g., 'rank(momentum(close, 20))'"
    )
    data_path: str = Field(
        default="data/sample_ohlcv.csv", description="Path to the OHLCV CSV file."
    )


class EvaluateAlphaResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    referenced_columns: List[str]
    referenced_operators: List[str]
    alpha_preview: Optional[List[float]] = None


class BacktestRequest(BaseModel):
    formula: str = Field(..., description="Alpha formula to run.")
    data_path: str = Field(
        default="data/sample_ohlcv.csv", description="Path to the OHLCV CSV file."
    )
    mode: str = Field(
        default="long_short", description="Signal generation mode: 'long_short' or 'long_flat'."
    )
    upper_quantile: float = Field(default=0.7, description="Upper threshold quantile.")
    lower_quantile: float = Field(default=0.3, description="Lower threshold quantile.")
    transaction_cost: float = Field(default=0.0005, description="Percentage fee per trade.")
    slippage: float = Field(default=0.0005, description="Percentage slippage per trade.")


class BacktestResponse(BaseModel):
    metrics: Dict[str, Any]
    dates: List[str]
    equity_curve: List[float]
    drawdown: List[float]
    signals: List[int]
    trades: List[float]


class RiskRequest(BaseModel):
    metrics: Dict[str, Any] = Field(..., description="Metrics dictionary from backtest execution.")


class RiskResponse(BaseModel):
    decision: str = Field(..., description="APPROVE, REDUCE, or REJECT.")
    reasons: List[str]
    recommended_position_scale: float
    disclaimer: str
