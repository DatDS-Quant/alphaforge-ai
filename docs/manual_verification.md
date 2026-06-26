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
40 passed in X.XXs

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

This opens the interactive Swagger UI interface to inspect and trigger GET /health, POST /data/generate, POST /alpha/evaluate, POST /backtest/run, POST /risk/evaluate, POST /report/generate, and POST /experiments/save endpoints.

### Run Streamlit Dashboard
Launch the frontend dashboard interface using:
streamlit run dashboard/streamlit_app.py

This opens a browser tab (typically at http://localhost:8501) with five plain-text tabs: AI Alpha Research Desk, Alpha Formula, Backtest Lab, Risk Review, and Research Report.

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
4. Navigate to the "AI Alpha Research Desk" tab.
5. In the "Your Alpha Concept" text area, test with one of the following sample prompts:
   - "Find a momentum alpha" (Expects formula: rank(momentum(close, 20)))
   - "Find a mean reversion alpha" (Expects formula: -zscore(close, 20))
   - "Find a momentum alpha confirmed by abnormal volume" (Expects formula: zscore(volume, 60) * rank(momentum(close, 20)))
   - "Find a volatility-aware trend alpha" (Expects formula: rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60))
6. Choose a Research Framing Style (e.g. balanced, conservative, aggressive).
7. Click "Generate Alpha Idea". The dashboard updates the session state and the sidebar's default formula updates automatically.
8. Navigate to the "Backtest Lab" tab and click "Run Backtest" (in the sidebar) to backtest the generated formula.
9. Inspect the outputs:
   - Tab "Alpha Formula" displays "Validation Result: VALID", referencing columns and operators used by the agent.
   - Tab "Backtest Lab" renders the equity curve and drawdown charts, and displays a metrics summary (e.g. Sharpe ratio, total return) and recent signals.
   - Tab "Risk Review" displays the decision (APPROVE, REDUCE, or REJECT), the recommended scale, and reasons.
   - Tab "Research Report" compiles the results into a markdown research memo.
10. In the "Research Report" tab, click "Generate Research Report" to generate the Markdown memo.
11. Inspect the generated report in the dashboard. It will include performance metrics, AST validations, and risk reviews.
12. Click "Save Experiment Artifacts" to persist the experiment. The dashboard will print:
    - Experiment ID: `[experiment_id]`
    - Report Path: `reports/experiments/[experiment_id]_report.md`
    - Metadata Path: `reports/experiments/[experiment_id]_metadata.json`

## Inspecting Saved Experiments

You can verify and view saved artifacts on the filesystem:
1. Navigate to the `reports/experiments/` folder.
2. Open `{experiment_id}_report.md` to see the complete markdown research memo.
3. Open `{experiment_id}_metadata.json` to verify the JSON metadata dictionary. Check that:
   - The JSON contains metrics, validation status, risk decision, backtest config, limitations, and next steps.
   - Large raw arrays like `equity_curve` and `drawdown` are successfully excluded.

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

## Running Demo Scenarios

The synthetic scenario selector in the Streamlit sidebar (Data Settings section) allows you to simulate different pricing regimes. You can also generate these via the command line:

```bash
# Generate a bullish trend path:
python -m app.data.sample_generator --scenario trend_up --days 1000 --seed 42

# Generate a bearish trend path:
python -m app.data.sample_generator --scenario trend_down --days 1000 --seed 42

# Generate a mean-reverting price path:
python -m app.data.sample_generator --scenario mean_reverting --days 1000 --seed 42

# Generate a highly volatile path:
python -m app.data.sample_generator --scenario volatile --days 1000 --seed 42
```

> [!NOTE]
> All scenarios are fully synthetic and deterministic. They are used for testing pipeline mechanics under different simulated conditions, and do not represent real-market dynamics or guarantee future strategy profitability.

## Recommended Demo Path for Recruiters / Reviewers

To showcase the complete research lifecycle (including risk management limits, approvals, and report generation), follow this recommended path in the Streamlit dashboard:

1. **Step 1: Risk Rejection Demonstration**
   - In the sidebar under **Data Settings**, set **Synthetic Scenario** to `random_walk` or `volatile` and click **Generate Sample Data**.
   - Go to the **AI Alpha Research Desk** and enter a prompt: "Find a momentum alpha".
   - Click **Generate Alpha Idea**.
   - Go to the **Backtest Lab** and click **Run Backtest**.
   - Review the results. If the strategy suffers from severe drawdowns (e.g. drawdown exceeds -25%) or lacks sufficient trade volume under these market conditions, navigate to the **Risk Review** tab. The status panel at the top will indicate **Backtest completed. Risk decision: REJECT.** (or REDUCE).
   - In **Research Report**, click **Generate Research Report** to see the suggested action: "Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests."

2. **Step 2: Strategy Sizing / Approval Demonstration**
   - In the sidebar under **Data Settings**, change **Synthetic Scenario** to `trend_up`. Click **Generate Sample Data**. (A strong positive drift is highly favorable to momentum signals).
   - Navigate to the **Backtest Lab** and click **Run Backtest**.
   - The strategy return should be significantly improved. Navigate to the **Risk Review** tab. The status panel at the top will show **Backtest completed. Risk decision: APPROVE.** or **REDUCE.**.
   - Review the metrics table which compares the strategy returns with the baseline buy-and-hold benchmark return.

3. **Step 3: Generate and Save Experiment Artifacts**
   - Navigate to the **Research Report** tab.
   - Click **Generate Research Report**. Notice that the report begins with a clear **Research Verdict** outlining the decision, primary reason, total return, Sharpe, max drawdown, and suggested action, followed by the "Full Research Memo" expander.
   - Click **Save Experiment Artifacts**.
   - Verify the generated Markdown and JSON files are stored in the `reports/experiments/` folder.


