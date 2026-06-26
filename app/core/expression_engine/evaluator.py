import numpy as np
import pandas as pd

from app.core.expression_engine.operators import (
    delay,
    delta,
    momentum,
    rank,
    ts_mean,
    ts_rank,
    ts_std,
    zscore,
)
from app.core.expression_engine.validator import validate_expression


def evaluate_expression(formula: str, df: pd.DataFrame) -> pd.Series:
    """
    Evaluate a formula expression against a DataFrame after running security and domain validations.
    Returns the resulting series named 'alpha'.
    """
    # Run AST validation first
    val_result = validate_expression(formula)
    if not val_result.is_valid:
        raise ValueError(f"Formula validation failed: {'; '.join(val_result.errors)}")

    # Build restricted evaluation environment
    eval_globals = {
        "ts_mean": ts_mean,
        "ts_std": ts_std,
        "ts_rank": ts_rank,
        "zscore": zscore,
        "momentum": momentum,
        "delta": delta,
        "delay": delay,
        "rank": rank,
        "__builtins__": {},  # Strictly disable all Python builtins
    }

    # Load required columns from the dataframe into the local context
    eval_locals = {}
    for col in val_result.referenced_columns:
        if col not in df.columns:
            raise ValueError(
                f"Column '{col}' referenced in formula is missing from input DataFrame"
            )
        eval_locals[col] = df[col]

    try:
        # eval is safe here as the formula AST was thoroughly checked and restricted
        result = eval(formula.strip(), eval_globals, eval_locals)
    except Exception as e:
        raise ValueError(f"Expression evaluation error: {str(e)}") from e

    # Ensure standard pandas Series return
    if isinstance(result, pd.Series):
        result.name = "alpha"
        return result
    elif isinstance(result, (int, float, np.number)):
        # Promote scalars to Series with correct index
        series = pd.Series(result, index=df.index, dtype=float)
        series.name = "alpha"
        return series
    else:
        raise ValueError(
            f"Formula did not return a valid pandas Series or scalar, got {type(result)}"
        )
