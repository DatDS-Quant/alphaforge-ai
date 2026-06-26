import re

from app.agents.mock_alpha_agent import MockAlphaAgent
from app.core.expression_engine.validator import validate_expression


def test_agent_themes():
    """
    Verify MockAlphaAgent returns appropriate formulas for each keyword theme.
    """
    agent = MockAlphaAgent()

    # 1. Momentum
    idea_mom = agent.generate_alpha_idea("Find a trend-following momentum breakout strategy")
    assert idea_mom.formula == "rank(momentum(close, 20))"

    # 2. Mean Reversion
    idea_rev = agent.generate_alpha_idea("Create a mean reversion reversal overbought indicator")
    assert idea_rev.formula == "-zscore(close, 20)"

    # 3. Volume
    idea_vol = agent.generate_alpha_idea("Develop an alpha with abnormal volume participation")
    assert idea_vol.formula == "zscore(volume, 60) * rank(momentum(close, 20))"

    # 4. Volatility-Aware
    idea_volat = agent.generate_alpha_idea(
        "Find a risk adjusted strategy in noisy volatility regimes"
    )
    assert idea_volat.formula == "rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60)"

    # 5. Default Fallback
    idea_def = agent.generate_alpha_idea("Evaluate close and open prices")
    assert idea_def.formula == "rank(momentum(close, 20))"


def test_agent_priority():
    """
    Verify mixed prompts select the correct formula based on predefined priorities.
    Priority order: volume, volatility-aware, mean reversion, momentum.
    """
    agent = MockAlphaAgent()

    # Volume (highest) + Volatility + Reversion + Momentum
    idea = agent.generate_alpha_idea(
        "momentum trend reversal volatility noisy abnormal volume liquidity"
    )
    assert idea.formula == "zscore(volume, 60) * rank(momentum(close, 20))"

    # Volatility + Reversion + Momentum (No volume)
    idea_novol = agent.generate_alpha_idea("momentum trend reversal volatility noisy stable")
    assert idea_novol.formula == "rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60)"

    # Reversion + Momentum (No volume, no volatility)
    idea_norev = agent.generate_alpha_idea("momentum trend reversal revert oversold")
    assert idea_norev.formula == "-zscore(close, 20)"


def test_validation_of_agent_formulas():
    """
    Verify all formulas returned by the mock agent pass security and structure validations.
    """
    agent = MockAlphaAgent()
    prompts = [
        "momentum trend",
        "mean reversion reversal",
        "volume participation",
        "volatility noisy",
        "something else",
    ]
    for prompt in prompts:
        idea = agent.generate_alpha_idea(prompt)
        val_res = validate_expression(idea.formula)
        assert (
            val_res.is_valid
        ), f"Agent formula failed validation: {idea.formula}. Errors: {val_res.errors}"


def test_output_structure_and_plain_text():
    """
    Verify that generated AlphaIdea objects contain all required fields and adhere to plain-text rules (no emojis/icons).
    """
    agent = MockAlphaAgent()
    idea = agent.generate_alpha_idea("abnormal volume momentum")

    # Structure check
    required_fields = [
        "title",
        "hypothesis",
        "formula",
        "required_columns",
        "expected_behavior",
        "risk_notes",
        "explanation",
        "tags",
    ]
    for field in required_fields:
        val = getattr(idea, field)
        assert val is not None
        if isinstance(val, str):
            assert len(val.strip()) > 0
        elif isinstance(val, list):
            assert len(val) > 0

    # Plain text check: verify no emojis or decorative Unicode symbols
    # Standard printable ASCII (or standard text characters) only
    all_text = f"{idea.title} {idea.hypothesis} {idea.formula} {' '.join(idea.required_columns)} {idea.expected_behavior} {' '.join(idea.risk_notes)} {idea.explanation} {' '.join(idea.tags)}"

    # Emojis are outside standard basic multilingual plane or standard alphanumeric text.
    # Check for typical emoji unicode blocks
    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"  # Emoticons
        "\U0001f300-\U0001f5ff"  # Misc Symbols and Pictographs
        "\U0001f680-\U0001f6ff"  # Transport and Map Symbols
        "\U0001f1e0-\U0001f1ff"  # Regional Indicator Flags
        "\u2700-\u27bf"  # Dingbats
        "\u2600-\u26ff"  # Misc Symbols
        "]+",
        flags=re.UNICODE,
    )
    assert not emoji_pattern.search(all_text), "Found emoji/icon character in agent response"


def test_agent_service_successful_flow():
    """
    Verify generate_and_validate_alpha_idea service returns complete AlphaIdeaResponse.
    """
    from app.agents.service import generate_and_validate_alpha_idea

    response = generate_and_validate_alpha_idea("reversal trend", preferred_style="aggressive")
    assert response.idea.title == "Short-Term Mean Reversion Alpha"
    assert response.validation.is_valid is True
    assert len(response.warnings) >= 2
    assert "reversal" in response.idea.tags


def test_agent_preferred_style_affects_explanation():
    """
    Verify that the preferred style modifies the generated explanation string suffix.
    """
    agent = MockAlphaAgent()

    idea_cons = agent.generate_alpha_idea("momentum", preferred_style="conservative")
    assert "conservative parameter selection" in idea_cons.explanation

    idea_agg = agent.generate_alpha_idea("momentum", preferred_style="aggressive")
    assert "return maximization" in idea_agg.explanation


def test_agent_style_edge_cases():
    """
    Verify fallback behavior and robust handling when preferred style is empty.
    """
    agent = MockAlphaAgent()
    idea = agent.generate_alpha_idea("momentum", preferred_style="")
    # Should compile without style suffix
    assert not idea.explanation.endswith(")")


def test_agent_trace_logs():
    """
    Verify volume prompt classifies theme and generates detailed trace log fields.
    """
    from app.agents.service import generate_and_validate_alpha_idea

    response = generate_and_validate_alpha_idea("abnormal volume momentum breakout")

    # 1. Check theme classification
    assert response.trace.detected_theme == "volume_confirmation"

    # 2. Check trace fields
    assert response.trace.formula_template == "zscore(volume, 60) * rank(momentum(close, 20))"
    assert response.trace.validation_status == "VALID"
    assert len(response.trace.warnings) >= 2

    # 3. Check for absence of icons/emojis in trace
    import re

    emoji_pattern = re.compile(
        "[" "\U00010000-\U0010ffff" "\u2600-\u27bf" "\u2000-\u32ff" "]", flags=re.UNICODE
    )
    assert not emoji_pattern.search(response.trace.detected_theme)
    assert not emoji_pattern.search(response.trace.formula_template)
    for w in response.trace.warnings:
        assert not emoji_pattern.search(w)
