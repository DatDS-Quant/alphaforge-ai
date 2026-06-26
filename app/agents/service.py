from app.agents.mock_alpha_agent import MockAlphaAgent
from app.agents.schemas import AgentTrace, AlphaIdeaResponse
from app.core.expression_engine.validator import validate_expression


def generate_and_validate_alpha_idea(
    user_prompt: str, preferred_style: str = "balanced"
) -> AlphaIdeaResponse:
    """
    Generate an alpha idea using the MockAlphaAgent, validate its mathematical formula
    using the AST validator, and return the combined result with security and research warnings.
    """
    agent = MockAlphaAgent()
    idea = agent.generate_alpha_idea(user_prompt, preferred_style)

    # Run the existing safe expression validator
    validation = validate_expression(idea.formula)

    # Build standard warnings
    warnings = [
        "Generated using a deterministic mock AI research agent.",
        "This formula is a simplified, synthetic representation for research demo purposes.",
    ]

    # Include any warnings from AST validator
    if validation.warnings:
        warnings.extend(validation.warnings)

    theme = agent.classify_theme(user_prompt)
    trace = AgentTrace(
        detected_theme=theme,
        formula_template=idea.formula,
        validation_status="VALID" if validation.is_valid else "INVALID",
        warnings=warnings,
    )

    return AlphaIdeaResponse(idea=idea, validation=validation, warnings=warnings, trace=trace)
