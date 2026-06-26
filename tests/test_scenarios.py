from app.data.sample_generator import generate_sample_data


def test_random_walk_determinism():
    """
    Verify random_walk scenario is deterministic for same seed.
    """
    df1 = generate_sample_data(days=100, seed=42, scenario="random_walk")
    df2 = generate_sample_data(days=100, seed=42, scenario="random_walk")
    assert df1["close"].tolist() == df2["close"].tolist()


def test_trend_up_direction():
    """
    Verify trend_up scenario has a higher ending price than starting price.
    """
    df = generate_sample_data(days=100, seed=42, scenario="trend_up")
    assert df["close"].iloc[-1] > df["close"].iloc[0]


def test_trend_down_direction():
    """
    Verify trend_down scenario has a lower ending price than starting price.
    """
    df = generate_sample_data(days=100, seed=42, scenario="trend_down")
    assert df["close"].iloc[-1] < df["close"].iloc[0]


def test_volatile_regime_volatility():
    """
    Verify volatile scenario has a higher return volatility than random_walk.
    """
    df_rw = generate_sample_data(days=100, seed=42, scenario="random_walk")
    df_vol = generate_sample_data(days=100, seed=42, scenario="volatile")

    # Recompute returns safely
    ret_rw = df_rw["close"].pct_change().dropna()
    ret_vol = df_vol["close"].pct_change().dropna()

    assert ret_vol.std() > ret_rw.std()


def test_mean_reverting_behavior():
    """
    Verify mean_reverting scenario converges around its long-term average.
    """
    df = generate_sample_data(days=200, seed=42, scenario="mean_reverting")
    # Verify closing prices stay near the initial and long-term average 100.0
    assert df["close"].mean() > 80.0
    assert df["close"].mean() < 120.0
