# AlphaForge AI

AI-powered quantitative research and alpha expression engine.

## What This Project Is

AlphaForge AI is an open-source AI engineering platform for finance designed to help quantitative researchers model, backtest, and evaluate alpha ideas. It aims to eventually translate natural-language alpha hypotheses into mathematical representations, validate them for safety, run high-performance historical simulations, and provide risk reviews.

## What This Project Is Not

AlphaForge AI is NOT a live trading bot, a real-time portfolio execution system, or a high-frequency trading platform. It does not connect directly to brokerage APIs for order routing, and does not provide financial or investment advice.

### Core Workflow

1. Data Generation and Loading: Generate synthetic OHLCV time-series data or load local CSV files to clean, validate, and compute asset returns.
2. Expression Evaluation: Formulate alpha expressions using windowed operations (like rolling standard deviations, ranks, or moving averages) and evaluate them securely on time-series data.
3. Signal Generation: Generate entry and exit signals using threshold rules like rolling or expanding quantiles to avoid future lookahead leakage.
4. Vectorized Backtesting: Simulate trading strategy performance with transaction fees and slippage using historical shifted positions.
5. Risk Evaluation: Apply deterministic checklist rules (e.g. drawdown checks, transaction counts) to approve, reduce, or reject strategy position sizes.
6. Research Report Generation: Compile quantitative metrics, risk reviews, and mathematical details into a structured quantitative research memo.
7. Experiment Artifact Saving: Serialize the full experiment details (metadata JSON and report Markdown) directly to the local filesystem.

## Current MVP Scope

This version includes:
- Deterministic Mock AI Alpha Research Agent for translating natural-language concepts into valid mathematical formulas.
- Synthetic daily OHLCV random-walk generation.
- Validated mathematical syntax parser using Python Abstract Syntax Trees (AST).
- Vectorized quant engine with lookahead-free quantile thresholds.
- Essential performance metrics (Sharpe, Sortino, drawdown, win rate, profit factor, turnover).
- Basic rules-based risk decision overlay.
- Research Report Agent for generating deterministic quantitative memos from strategy metrics.
- Local, file-based Experiment Artifact Store.
- Plain-text FastAPI server and React research terminal interface.

## System Architecture

The project is structured as follows:

- app/core/expression_engine/: Houses safe operators, AST validation rules, and the evaluation sandbox.
- app/core/backtester/: Handles position thresholding and vectorized returns calculation.
- app/core/metrics/: Computes performance statistics.
- app/core/risk/: Evaluates risk criteria.
- app/data/: Generates and cleans input OHLCV datasets.
- app/agents/: Mock AI Alpha agent, Research Report Agent, artifact store, and report service.
- app/api/: FastAPI schemas, routes, and endpoints.
- frontend/: React-based custom research terminal workstation.

## Setup Instructions

1. Ensure Python 3.11 or higher is installed.
2. Create and activate a virtual environment:
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
3. Install the dependencies:
   pip install -r requirements.txt

## Execution Commands

### Run Sample Data Generator

To generate 1000 days of deterministic daily OHLCV data to data/sample_ohlcv.csv:
python -m app.data.sample_generator

### Run Tests

To run the full unit test suite:
pytest

### Run API Server

To start the FastAPI server:
uvicorn app.main:app --reload

### Run React Research Terminal

To install and launch the React workspace:
```bash
cd frontend
npm install
npm run dev
```

The web terminal is accessible at: http://localhost:5173

## Mock AI Alpha Research Agent

AlphaForge AI includes a deterministic, rule-based Mock AI Alpha Research Agent. It translates natural-language prompts into lookahead-free mathematical formulas based on keyword matches.

Why Mock Mode is Useful:
- No Quota or Key Usage: Operates entirely offline without requiring paid API keys or network latency.
- Reproducible Demos: Ensures the same formula is generated for the same prompt, facilitating reliable test runs.
- Pluggable Structure: Exposes the exact schemas and endpoints required, allowing a real LLM model or genetic programming engine to be swapped in later without modifying other layers.

API Endpoint:
POST /alpha/generate
Request:
{
  "user_prompt": "Find a momentum alpha confirmed by abnormal volume",
  "preferred_style": "balanced"
}
Response yields:
zscore(volume, 60) * rank(momentum(close, 20))

## Research Report Agent & Artifact Saving

The platform includes a deterministic Research Report Agent that converts the generated alpha idea, validation output, backtest metrics, and risk decisions into a professional research memo. Users can then save the experiment locally.

API Endpoints:

1. Generate Report:
POST /report/generate
Request: ResearchReportInput Pydantic model containing title, hypothesis, formula, required_columns, expected_behavior, risk_notes, explanation, validation, metrics, risk_decision, and backtest_config.
Response: ResearchReport Pydantic model containing title, summary, report_markdown, limitations, and next_steps.

2. Save Experiment:
POST /experiments/save
Request: ResearchReportInput
Response: ExperimentArtifact containing experiment_id, report_path, metadata_path, and created_at.

File Locations:
Saved experiments are written locally to:
- reports/experiments/{experiment_id}_report.md
- reports/experiments/{experiment_id}_metadata.json

Research Workstation Workflow:
Research Desk -> Formula Lab -> Backtest Lab -> Risk Review -> Research Memo -> Experiment Artifacts
1. Research Desk: Submit a natural-language concept and generate a structured research hypothesis.
2. Formula Lab: Validate mathematical operators and sandbox security checks using AST validation.
3. Backtest Lab: Run a vectorized historical simulation, comparing strategy equity curves against a buy-and-hold benchmark.
4. Risk Review: Check quantitative limits checklist for APPROVE, REDUCE, or REJECT sizing recommendation decisions.
5. Research Memo: Compile the full research memo and save local experiment metadata and report files.

## Benchmark Comparison

The backtest execution now calculates a baseline buy-and-hold equity curve alongside the strategy returns.
- buy_hold_total_return: Cumulative return of the underlying asset over the backtest period.
- strategy_excess_return_vs_buy_hold: Total strategy return minus buy-and-hold return.
- strategy_correlation_to_asset_return: Safe correlation coefficient between daily strategy returns and asset returns.
- exposure_ratio: Fraction of total days where the strategy holds an active position (absolute signal > 0).

## Synthetic Scenario Selector

You can generate synthetic price paths using five distinct simulation modes in the Data Settings expander:
- random_walk: Default geometric random walk.
- trend_up: Random walk with a positive drift.
- trend_down: Random walk with a negative drift.
- mean_reverting: Simulates Ornstein-Uhlenbeck-like mean reverting behavior.
- volatile: Higher volatility path.

All scenarios are generated deterministically using the specified seed.

## Agent Trace Logs

When generating an idea, the AI Desk provides an Agent Trace logs panel summarizing the classified theme, formula template selected, AST validation status, and warnings. This details how the mock LLM mapped intent to mathematical code offline.

## System Limitations & Scope

- Single-Asset Time-Series Signals: Current formula evaluations produce single-asset time-series signals based on local threshold quantiles. It is not a multi-asset cross-sectional alpha rank engine.
- Flat File Storage: Experiments are saved locally as Markdown and JSON files. A central database index is not yet implemented.
- Vectorized Assumptions: Zero execution lag, zero borrow costs, and vectorized executions are assumed.

## Roadmap

- Phase 2: Add SQLAlchemy database layer and local SQLite support. (Planned)
- Phase 3: Integrate offline, local mock LLM agents for natural language to formula translation. (Completed)
- Phase 4: Implement Research Report Agent and lightweight file-based experiment artifact saving. (Completed)
- Phase 5A: Add dashboard UX polish, benchmark metrics, and synthetic scenarios. (Completed)

## Disclaimer

This project is for research and educational purposes only. It does not constitute financial, investment, or trading advice. Trading financial markets carries substantial risks of capital loss.
