# Manual Verification Manual

This document provides a guide for validating the AlphaForge AI MVP workspace features manually, documenting command executions, typical quantitative workflow steps, API documentation access, and resolution steps for common failure cases.

## System Setup

Ensure you have installed the core package dependencies:
pip install -r requirements.txt

## Execution Commands

### Generate Sample Data
Run the synthetic daily candles random walk generator using:
python -m app.data.sample_generator --days 1000 --seed 42 --output-path data/sample_ohlcv.csv

Expected output:
Generated 1000 days of sample data at data/sample_ohlcv.csv

### Run Automated Tests
Run the unit and smoke test suite using:
pytest

Expected output:
21 passed in X.XXs

### Run API Server
Start the FastAPI backend server using:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Expected output:
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)

### View API Documentation
Once the API server is running, open your web browser and navigate to:
http://127.0.0.1:8000/docs

This opens the interactive Swagger UI interface to inspect and trigger GET /health, POST /data/generate, POST /alpha/evaluate, POST /backtest/run, and POST /risk/evaluate endpoints.

### Run Streamlit Dashboard
Launch the frontend dashboard interface using:
streamlit run dashboard/streamlit_app.py

This opens a browser tab (typically at http://localhost:8501) with three plain-text tabs: Alpha Formula, Backtest Lab, and Risk Review.

## Sample Quantitative Workflow Example

1. Start the backend API server and Streamlit dashboard.
2. In the Streamlit sidebar, configure the target parameters:
   - Days to Generate: 1000
   - Random Seed: 42
   - Alpha Formula: rank(momentum(close, 20))
   - Signal Mode: long_short
   - Upper Quantile Threshold: 0.7
   - Lower Quantile Threshold: 0.3
   - Transaction Cost Rate: 0.0005
   - Slippage Rate: 0.0005
3. Click "Generate Sample Data". The dashboard generates and saves data/sample_ohlcv.csv.
4. Click "Run Backtest". The dashboard validates the formula AST, evaluates the alpha values, generates lookahead-free signals, runs the backtester, computes metrics, and runs risk rules.
5. Inspect the outputs:
   - Tab "Alpha Formula" displays "Validation Result: VALID", referencing column "close" and operators "rank", "momentum".
   - Tab "Backtest Lab" renders the equity curve and drawdown charts, and displays a metrics summary (e.g. Sharpe ratio, total return) and recent signals.
   - Tab "Risk Review" displays the decision (APPROVE, REDUCE, or REJECT), the recommended scale, and reasons.

## Common Failure Cases and Fixes

### Error: "Data file not found at: data/sample_ohlcv.csv"
- Cause: The backtest engine or evaluator was run before generating sample data.
- Fix: Run the sample generator command first or click "Generate Sample Data" in the dashboard sidebar.

### Error: "Formula validation failed: Forbidden variable or name reference: X"
- Cause: The formula contains a column or variable that is not in the allowed list (open, high, low, close, volume, return).
- Fix: Only use allowed columns. Change the formula to use Close instead of custom variable names.

### Error: "Formula validation failed: Forbidden or unknown function call: Y"
- Cause: The formula calls a function that is not in the allowed operators list (ts_mean, ts_std, ts_rank, zscore, momentum, delta, delay, rank).
- Fix: Replace the custom function with permitted operators.

### Error: "Formula validation failed: Window size for ts_mean must be greater than zero, got -5"
- Cause: An operator like ts_mean or zscore was passed a negative or zero window size parameter.
- Fix: Update the formula window size parameter to a positive integer constant (e.g. change -5 to 10).

### Error: "Port 8000 already in use"
- Cause: Another process is already running on the backend port.
- Fix: Run uvicorn on another port:
  uvicorn app.main:app --port 8080 --reload
  And ensure the API calls or environment values match the new port.
