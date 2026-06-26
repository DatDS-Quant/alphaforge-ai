import pandas as pd

from app.core.expression_engine.evaluator import evaluate_expression
from app.core.expression_engine.validator import validate_expression


def test_validator_safe_formulas():
    """
    Verify validator accepts safe mathematical expressions using only allowed columns and operators.
    """
    safe_formulas = [
        "rank(momentum(close, 20))",
        "zscore(volume, 60) * rank(momentum(close, 20))",
        "-zscore(close, 20)",
        "ts_mean(close, 10) + ts_std(volume, 20)",
        "delay(close, 5) * 1.5",
    ]
    for formula in safe_formulas:
        res = validate_expression(formula)
        assert res.is_valid, f"Expected safe formula to be valid: {formula}. Errors: {res.errors}"


def test_validator_unsafe_formulas():
    """
    Verify validator rejects unsafe formulas containing imports, assignments, builtins,
    attribute access, subscript access, or dynamic functions.
    """
    unsafe_formulas = [
        "import os",
        "close.__class__",
        "close[0]",
        "lambda x: x",
        "[x for x in close]",
        "eval('close')",
        "exec('close')",
        "open('file.txt')",
        "close.value",
        "close = 1",
        "__builtins__",
        "globals()",
        "locals()",
        "unknown_function(close)",
        "close + unknown_variable",
    ]
    for formula in unsafe_formulas:
        res = validate_expression(formula)
        assert not res.is_valid, f"Expected unsafe formula to be invalid: {formula}"


def test_evaluator_returns_alpha():
    """
    Verify evaluator returns a pandas Series named 'alpha' when running valid formulas.
    """
    df = pd.DataFrame(
        {"close": [10.0, 11.0, 12.0, 13.0, 14.0], "volume": [100.0, 110.0, 120.0, 130.0, 140.0]}
    )
    formula = "momentum(close, 2) * zscore(volume, 3)"
    res = evaluate_expression(formula, df)

    assert isinstance(res, pd.Series)
    assert res.name == "alpha"
    assert len(res) == len(df)
