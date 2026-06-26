import pandas as pd
import pytest

from app.data.sample_generator import generate_sample_data


def test_sample_generator_columns():
    """
    Test that generated data has the correct columns.
    """
    df = generate_sample_data(days=100, seed=42)
    expected_cols = ["date", "open", "high", "low", "close", "volume"]
    for col in expected_cols:
        assert col in df.columns
    assert len(df) == 100


def test_sample_generator_determinism():
    """
    Test that generator with the same seed yields identical results.
    """
    df1 = generate_sample_data(days=100, seed=42)
    df2 = generate_sample_data(days=100, seed=42)
    df3 = generate_sample_data(days=100, seed=43)

    # Matching seed check
    pd.testing.assert_series_equal(df1["close"], df2["close"])

    # Different seed check
    with pytest.raises(AssertionError):
        pd.testing.assert_series_equal(df1["close"], df3["close"])
