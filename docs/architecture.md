# AlphaForge Research Terminal System Architecture

This document provides a technical overview of the AlphaForge Research Terminal repository, detailing component layout, operational data flows, module responsibilities, limitations, and future steps.

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
   - report_schemas.py: Input and output models for quantitative reports.
   - report_agent.py: Builds deterministic markdown quantitative report memos.
   - artifact_store.py: Creates filesystem-safe experiment IDs and writes metadata JSON and report Markdown to disk.
   - report_service.py: Service coordinator linking the report agent and artifact store.
8. app/frontend/
   - React-based custom research terminal workstation.

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
10. The user requests a Research Report, which deterministically constructs a structured Markdown memo combining all evaluation steps.
11. The user saves the experiment, which generates a filesystem-safe experiment ID and writes the metadata JSON and report Markdown to the local filesystem.

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

### Research Report Agent & Artifact Store
The Research Report Agent formats the experimental inputs, validations, metrics, and decisions into a consistent, clear Markdown document. The Artifact Store cleans out oversized arrays (like raw daily equity curves or drawdowns) and outputs the remaining structured parameters to metadata JSON and Markdown files.

## Benchmark Metrics Flow

To provide a quantitative credibility layer, the backtester computes strategy performance relative to a baseline buy-and-hold benchmark using the same synthetic asset price path.
1. Return Computation: The data loader calculates daily asset returns from the price series.
2. Benchmark Equity Curve: The backtest engine calculates the buy-and-hold returns (`buy_hold_return = asset_return`) and the cumulative buy-and-hold equity curve as the cumulative product of 1 + asset returns.
3. Comparative Metrics: The performance metrics engine calculates benchmark metrics:
   - `buy_hold_total_return`: Cumulative performance of the underlying asset over the backtest.
   - `strategy_excess_return_vs_buy_hold`: Total strategy return minus buy-and-hold return.
   - `strategy_correlation_to_asset_return`: Pearson correlation coefficient of daily strategy returns against asset returns (safely handling zero-variance scenarios by returning 0.0).
   - `exposure_ratio`: Fraction of days where the strategy holds an active position (absolute signal > 0).
4. Presentation: These metrics and equity curves are rendered together in the React Backtest Lab, included in the generated Research Report, and stored inside the experiment artifacts.

## Synthetic Scenario Generation Modes

The sample data generator supports five deterministic scenarios to test pipelines and strategy behaviors across diverse simulated market regimes without using real-world data:
1. `random_walk`: Default geometric random walk with a minor positive drift (mean return = 0.0002, volatility = 0.015).
2. `trend_up`: Random walk with a positive drift representing bullish conditions (mean return = 0.0015, volatility = 0.015).
3. `trend_down`: Random walk with a negative drift representing bearish conditions (mean return = -0.0012, volatility = 0.015).
4. `mean_reverting`: Ornstein-Uhlenbeck-like mean-reverting process on log-prices converging toward a target value of 100.0 (theta = 0.05, noise volatility = 0.012).
5. `volatile`: Random walk with elevated return volatility representing high-variance regimes (mean return = 0.0002, volatility = 0.04).

All scenarios use a deterministic random seed for complete reproducibility. These price paths are purely synthetic and are not intended to represent real market behavior or faked profitability.

## Agent Trace Flow

When a user submits a natural-language alpha prompt, the Mock AI Alpha Research Agent parses the query offline and generates a structured response alongside a detailed execution trace:
1. Keyword Parsing: The agent classifies the prompt into a financial theme based on keywords (e.g., momentum, volume, volatility).
2. Template Selection: The agent selects the corresponding formula template and default parameter values.
3. Trace Generation: The agent populates an `AgentTrace` containing:
   - `detected_theme`: The classified financial concept (e.g., volume_confirmation).
   - `formula_template_selected`: The base formula template used.
   - `validation_status`: The safety checks validation status (VALID/INVALID).
   - `warnings`: A list of potential assumptions or safety boundaries.
4. UI Display: The dashboard displays the trace panel in plain text, giving users immediate visibility into the mock agent's decision-making process.

## Limitations

- File-based Storage: Experiment details are saved directly as flat files on the local filesystem. A database engine is not yet used to query or search over historical runs.
- Vectorized backtesting: Vectorized simulations run instantly but do not model execution delays, order queue placement, margin requirements, or granular trade order matching.
- Single asset focus: Currently configured for single-stock or single-index alpha expressions. It does not support cross-sectional ranking across multiple assets simultaneously yet.
- Synthetic random walk: The synthetic generator provides deterministic pricing paths, but does not capture macro regimes, orderbook imbalances, or volume dynamics.

## Next Planned Phases

- Database Layer: Introduce SQL-based storage for alpha ideas, backtest configurations, and test run outcomes.
- Real LLM Integration: Swap the deterministic mock agent for actual local or API-based LLMs once connection infrastructure is configured.
- Multi-Asset Support: Extend the expression engine and signal generator to handle panels of assets.


