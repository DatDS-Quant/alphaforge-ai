# AlphaForge AI

AI-powered quantitative research and alpha expression engine.

## What This Project Is

AlphaForge AI is an open-source AI engineering platform for finance designed to help quantitative researchers model, backtest, and evaluate alpha ideas. It aims to eventually translate natural-language alpha hypotheses into mathematical representations, validate them for safety, run high-performance historical simulations, and provide risk reviews.

## What This Project Is Not

AlphaForge AI is NOT a live trading bot, a real-time portfolio execution system, or a high-frequency trading platform. It does not connect directly to brokerage APIs for order routing, and does not provide financial or investment advice.

## Core Workflow

1. Data Generation and Loading: Generate synthetic OHLCV time-series data or load local CSV files to clean, validate, and compute asset returns.
2. Expression Evaluation: Formulate alpha expressions using windowed operations (like rolling standard deviations, ranks, or moving averages) and evaluate them securely on time-series data.
3. Signal Generation: Generate entry and exit signals using threshold rules like rolling or expanding quantiles to avoid future lookahead leakage.
4. Vectorized Backtesting: Simulate trading strategy performance with transaction fees and slippage using historical shifted positions.
5. Risk Evaluation: Apply deterministic checklist rules (e.g. drawdown checks, transaction counts) to approve, reduce, or reject strategy position sizes.

## Current MVP Scope

This version includes:
- Synthetic daily OHLCV random-walk generation.
- Validated mathematical syntax parser using Python Abstract Syntax Trees (AST).
- Vectorized quant engine with lookahead-free quantile thresholds.
- Essential performance metrics (Sharpe, Sortino, drawdown, win rate, profit factor, turnover).
- Basic rules-based risk decision overlay.
- Plain-text FastAPI server and Streamlit dashboard interface.

## System Architecture

The project is structured as follows:

- app/core/expression_engine/: Houses safe operators, AST validation rules, and the evaluation sandbox.
- app/core/backtester/: Handles position thresholding and vectorized returns calculation.
- app/core/metrics/: Computes performance statistics.
- app/core/risk/: Evaluates risk criteria.
- app/data/: Generates and cleans input OHLCV datasets.
- app/api/: FastAPI schemas and routes.
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

## Roadmap

- Phase 2: Add SQLAlchemy database layer and local SQLite support.
- Phase 3: Integrate offline, local mock LLM agents for natural language to formula translation.
- Phase 4: Implement multi-asset portfolio backtesting and risk optimization models.

## Disclaimer

This project is for research and educational purposes only. It does not constitute financial, investment, or trading advice. Trading financial markets carries substantial risks of capital loss.
