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


def test_data_loader_no_backward_fill(tmp_path):
    """
    Verify that loader does not backward-fill missing data.
    Leading NaNs must remain NaN and be dropped, not filled with subsequent values.
    """
    from app.data.loader import load_ohlcv

    csv_file = tmp_path / "test_missing.csv"
    data = (
        "date,open,high,low,close,volume\n"
        "2023-01-01,,,,,\n"  # Leading missing row
        "2023-01-02,100,105,95,100,1000\n"
        "2023-01-03,,,,,\n"  # Mid missing row (should ffill)
        "2023-01-04,102,107,98,102,1200\n"
    )
    csv_file.write_text(data)

    df = load_ohlcv(str(csv_file))

    # Assert 2023-01-01 is dropped because it is a leading NaN and wasn't bfilled
    dates_str = df["date"].dt.strftime("%Y-%m-%d").tolist()
    assert "2023-01-01" not in dates_str

    # Assert 2023-01-03 was forward filled from 2023-01-02
    row_2 = df[df["date"].dt.strftime("%Y-%m-%d") == "2023-01-03"].iloc[0]
    assert row_2["close"] == 100.0
    assert row_2["volume"] == 1000.0
