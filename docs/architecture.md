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
7. dashboard/
   - streamlit_app.py: Provides the user dashboard interface.

## Operational Data Flow

Below is the execution flow during an evaluation run:

1. Synthetic daily OHLCV files are loaded and sorted by the loader, validating required columns.
2. The user submits a formula string (e.g. rank(momentum(close, 20))).
3. The validator parses the string using Python's AST module, ensuring that only allowed columns and operators are used, and that unsafe constructs (like imports, lambda expressions, subscripts, and dunders) are rejected.
4. The evaluator binds the columns from the dataset to the allowed mathematical operators inside a restricted environment, executing the formula using Python's eval function to output a clean alpha Series.
5. The signal generator calculates historical quantiles of the alpha Series (lags the thresholds by 1 period to prevent lookahead) and assigns buy, sell, or hold actions.
6. The backtester shifts positions by 1 period to prevent lookahead bias and simulates performance, deducting transaction fees and slippage whenever a position changes.
7. The metrics module compiles performance stats (Sharpe, Sortino, drawdowns), while the risk engine runs rules checks to APPROVE, REDUCE, or REJECT position scales.

## Module Responsibilities

### Data Loader and Generator
Ensures that all input files contain valid datetime entries and pricing columns, sorts them, cleans missing data by forward filling, and computes relative log returns without looking ahead.

### Expression Engine
A secure sandbox. The AST validator parses the user's formula prior to execution, preventing injection or malicious system calls. The operators module provides lookahead-free rolling statistical window calculations.

### Backtester Engine
Performs vector multiplications of the asset returns against lagged position signals. It also computes transaction cost deductions on position adjustments.

### Risk and Metrics Engines
Calculate risk statistics and apply logic gates. If a strategy's drawdowns exceed limits or trade frequency is too low, the system flags the strategy, reducing exposure scaling or rejecting the strategy.

## Limitations

- Vectorized backtesting: Vectorized simulations run instantly but do not model execution delays, order queue placement, margin requirements, or granular trade order matching.
- Single asset focus: Currently configured for single-stock or single-index alpha expressions. It does not support cross-sectional ranking across multiple assets simultaneously yet.
- Synthetic random walk: The synthetic generator provides deterministic pricing paths, but does not capture macro regimes, orderbook imbalances, or volume dynamics.

## Next Planned Phases

- Database Layer: Introduce SQL-based storage for alpha ideas, backtest configurations, and test run outcomes.
- Mock AI Agents: Add offline agents utilizing local models to help generate expressions or translate natural language ideas into formula strings.
- Multi-Asset Support: Extend the expression engine and signal generator to handle panels of assets.
