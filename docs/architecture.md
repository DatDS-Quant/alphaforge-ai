# AlphaForge AI System Architecture

This document provides a technical overview of the AlphaForge AI repository, detailing component layout, operational data flows, module responsibilities, limitations, and future steps.

## Component Layout

The repository utilizes a modular package layout:

1. app/data/
   - sample_generator.py: Generates synthetic daily asset candle tables.
   - loader.py: Standardizes tables, cleans missing elements, and computes return columns.
2. app/core/expression_engine/
   - operators.py: Mathematical and time-series rolling functions.
   - validator.py: Safe Abstract Syntax Tree (AST) validation.
   - evaluator.py: Restricted execution sandbox environment.
3. app/core/backtester/
   - signal.py: Converts raw numeric alpha values to trading instructions.
   - engine.py: Runs vectorized backtesting calculations.
4. app/core/metrics/
   - performance.py: Calculates returns, Sharpe/Sortino ratios, and turnover metrics.
5. app/core/risk/
   - rules.py: Enforces threshold rules for position scale decisions.
6. app/api/
   - schemas.py: Input and output models using Pydantic.
   - routes.py: Exposes functionality as REST endpoints.
7. app/agents/
   - schemas.py: Pydantic schemas for request and responses.
   - mock_alpha_agent.py: Class mapping text inputs to deterministic formulas.
   - service.py: Generates, validates, and appends warning messages to proposals.
8. dashboard/
   - streamlit_app.py: Provides the user dashboard interface.

## Operational Data Flow

Below is the execution flow during an evaluation run:

1. The user enters a natural-language alpha concept in the AI Alpha Research Desk tab.
2. The concept is parsed by the Mock AI Alpha Research Agent, which returns a structured research hypothesis and mathematical formula.
3. The formula is validated using Python's AST parser to ensure it contains only allowed components and is safe from malicious injections.
4. If valid, the formula is automatically set as the active sidebar formula.
5. Daily OHLCV data is loaded and returns are calculated.
6. The expression engine evaluates the formula in a restricted sandbox environment to generate the alpha values.
7. The signal engine calculates lookahead-free signal thresholds based on shifting historical quantiles of the alpha.
8. The backtester shifts positions by 1 period to prevent lookahead bias, executes trades, and computes strategy returns.
9. Metrics are evaluated, and the risk engine reviews the strategy, returning an APPROVE, REDUCE, or REJECT recommendation.

## Module Responsibilities

### Data Loader and Generator
Ensures that all input files contain valid datetime entries and pricing columns, sorts them, cleans missing data by forward filling, and computes relative log returns without looking ahead.

### Expression Engine
A secure sandbox. The AST validator parses the user's formula prior to execution, preventing injection or malicious system calls. The operators module provides lookahead-free rolling statistical window calculations.

### Backtester Engine
Performs vector multiplications of the asset returns against lagged position signals. It also computes transaction cost deductions on position adjustments.

### Risk and Metrics Engines
Calculate risk statistics and apply logic gates. If a strategy's drawdowns exceed limits or trade frequency is too low, the system flags the strategy, reducing exposure scaling or rejecting the strategy.

### AI Alpha Research Agent
Provides a deterministic rule-based framework that parses user intent keywords and returns structured proposals including hypotheses, tags, formulas, risk notes, and explanations. The service layer combines this with mathematical formula validation, and appends warnings about simplification or safety boundaries.

## Limitations

- Vectorized backtesting: Vectorized simulations run instantly but do not model execution delays, order queue placement, margin requirements, or granular trade order matching.
- Single asset focus: Currently configured for single-stock or single-index alpha expressions. It does not support cross-sectional ranking across multiple assets simultaneously yet.
- Synthetic random walk: The synthetic generator provides deterministic pricing paths, but does not capture macro regimes, orderbook imbalances, or volume dynamics.

## Next Planned Phases

- Database Layer: Introduce SQL-based storage for alpha ideas, backtest configurations, and test run outcomes.
- Real LLM Integration: Swap the deterministic mock agent for actual local or API-based LLMs once connection infrastructure is configured.
- Multi-Asset Support: Extend the expression engine and signal generator to handle panels of assets.
