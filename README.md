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
- Plain-text FastAPI server and Streamlit dashboard interface.

## System Architecture

The project is structured as follows:

- app/core/expression_engine/: Houses safe operators, AST validation rules, and the evaluation sandbox.
- app/core/backtester/: Handles position thresholding and vectorized returns calculation.
- app/core/metrics/: Computes performance statistics.
- app/core/risk/: Evaluates risk criteria.
- app/data/: Generates and cleans input OHLCV datasets.
- app/agents/: Mock AI Alpha agent, Research Report Agent, artifact store, and report service.
- app/api/: FastAPI schemas, routes, and endpoints.
- dashboard/: Streamlit dashboard implementation.

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

### Run Streamlit Dashboard

To launch the web interface:
streamlit run dashboard/streamlit_app.py

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

Dashboard Workflow:
AI Alpha Research Desk -> Backtest Lab -> Risk Review -> Research Report -> Save Experiment Artifacts
1. AI Alpha Research Desk: Submit a concept, generate a structured proposal, and check AST validation.
2. Backtest Lab: Click 'Run Backtest' to view the equity curve and performance metrics.
3. Risk Review: Access the post-backtest checklist to check the APPROVE, REDUCE, or REJECT status.
4. Research Report: Click 'Generate Research Report' to compile the quantitative memo. Click 'Save Experiment Artifacts' to save the report and metadata files locally.

## Roadmap

- Phase 2: Add SQLAlchemy database layer and local SQLite support. (Planned)
- Phase 3: Integrate offline, local mock LLM agents for natural language to formula translation. (Completed)
- Phase 4: Implement Research Report Agent and lightweight file-based experiment artifact saving. (Completed)

## Disclaimer

This project is for research and educational purposes only. It does not constitute financial, investment, or trading advice. Trading financial markets carries substantial risks of capital loss.
