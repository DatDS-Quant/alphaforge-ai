import pandas as pd
import pytest

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


@pytest.fixture
def sample_series():
    return pd.Series([10.0, 11.0, 12.0, 11.0, 13.0, 15.0], dtype=float)


def test_operator_returns_series(sample_series):
    """
    Verify operators return pandas Series.
    """
    assert isinstance(ts_mean(sample_series, 3), pd.Series)
    assert isinstance(ts_std(sample_series, 3), pd.Series)
    assert isinstance(ts_rank(sample_series, 3), pd.Series)
    assert isinstance(zscore(sample_series, 3), pd.Series)
    assert isinstance(momentum(sample_series, 3), pd.Series)
    assert isinstance(delta(sample_series, 3), pd.Series)
    assert isinstance(delay(sample_series, 3), pd.Series)
    assert isinstance(rank(sample_series), pd.Series)


def test_invalid_windows(sample_series):
    """
    Verify invalid windows raise ValueError.
    """
    invalid_windows = [0, -1, -10, 2.5, "five"]
    for w in invalid_windows:
        with pytest.raises(ValueError):
            ts_mean(sample_series, w)

        with pytest.raises(ValueError):
            ts_std(sample_series, w)

        with pytest.raises(ValueError):
            ts_rank(sample_series, w)


def test_delay_operator(sample_series):
    """
    Test shift delay operator behavior.
    """
    res = delay(sample_series, 2)
    assert pd.isna(res.iloc[0])
    assert pd.isna(res.iloc[1])
    assert res.iloc[2] == 10.0
    assert res.iloc[3] == 11.0
