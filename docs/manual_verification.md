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

### Run React Research Terminal
To install and launch the React workspace:
```bash
cd frontend
npm install
npm run dev
```

This opens a browser tab at http://localhost:5173 with seven professional workspace tabs: Home, Research Desk, Formula Lab, Backtest, Risk, Memo, and Artifacts.

## Sample Quantitative Workflow Example

1. Start the backend API server and launch the React research terminal.
2. In the sidebar Settings panel, configure the target parameters:
   - Days to Generate: 1000
   - Seed: 42
   - Synthetic Scenario: random_walk
   - Data File Path: data/sample_ohlcv.csv
   - Alpha Formula Expression: rank(momentum(close, 20))
   - Signal Mode: long_short
   - Upper Quantile: 0.7
   - Lower Quantile: 0.3
   - Transaction Cost Rate: 0.0005
   - Slippage Rate: 0.0005
3. Click "Gen Data" (either in the toolbar or Left Rail). The system generates and saves the file to the local disk.
4. Navigate to the "Research Desk" tab.
5. In the "Research Prompt" text area, test with one of the following sample prompts:
   - "Find a momentum alpha" (Expects formula: rank(momentum(close, 20)))
   - "Find a mean reversion alpha" (Expects formula: -zscore(close, 20))
   - "Find a momentum alpha confirmed by abnormal volume" (Expects formula: zscore(volume, 60) * rank(momentum(close, 20)))
   - "Find a volatility-aware trend alpha" (Expects formula: rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60))
6. Choose a Research Framing Style (e.g., balanced, conservative, aggressive).
7. Click "Generate Research Idea" (or "Gen Idea" in the toolbar). The system updates the workspace session and automatically populates the formula input.
8. Navigate to the "Formula Lab" tab and click "Validate Formula" to execute syntax safety checks.
9. Click "Run Backtest" (or "Backtest" in the toolbar) to evaluate strategy returns and show double-curve equity charts in "Backtest" page.
10. Navigate to the "Risk" tab and click "Perform Risk Compliance Audit" (or "Risk Review" in the toolbar) to run position scale calculations.
11. Navigate to the "Memo" tab. Click "Compile Research Memo" (or "Gen Memo" in the toolbar) to generate the Markdown report.
12. Click "Save Experiment Artifacts" (or "Save" in the toolbar) to persist the run. The terminal displays the ID and relative file paths on the local filesystem.

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

The synthetic scenario selector in the sidebar (Data Settings section) allows you to simulate different pricing regimes. You can also generate these via the command line:

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

To showcase the complete research lifecycle (including risk management limits, approvals, and report generation), follow this recommended path in the React research terminal:

1. **Step 1: Risk Rejection Demonstration**
   - In the toolbar under **Scenario**, set the **Synthetic Scenario** to `random_walk` or `volatile` and click **Gen Data**.
   - Go to the **Research Desk** page and enter a prompt: "Find a momentum alpha".
   - Click **Generate Research Idea** (or **Gen Idea** in the toolbar).
   - Go to the **Backtest** page and click **Run Backtest** (or **Backtest** in the toolbar).
   - Review the results. If the strategy suffers from severe drawdowns (e.g. drawdown exceeds -25%) or lacks sufficient trade volume under these market conditions, navigate to the **Risk** tab. The status strip at the top will indicate **RISK: REJECT** (or REDUCE).
   - In the **Memo** page, click **Compile Research Memo** (or **Gen Memo** in the toolbar) to see the suggested action: "Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests."

2. **Step 2: Strategy Sizing / Approval Demonstration**
   - In the toolbar, change **Scenario** to `trend_up`. Click **Gen Data**. (A strong positive drift is highly favorable to momentum signals).
   - Navigate to the **Backtest** page and click **Run Backtest** (or **Backtest** in the toolbar).
   - The strategy return should be significantly improved. Navigate to the **Risk** tab. The status strip at the top will show **RISK: APPROVE** or **REDUCE**.
   - Review the metrics tiles and tables comparing strategy returns against the baseline buy-and-hold benchmark return.

3. **Step 3: Generate and Save Experiment Artifacts**
   - Navigate to the **Memo** page.
   - Click **Compile Research Memo** (or **Gen Memo** in the toolbar). Notice that the report begins with a clear **Research Verdict** outlining the decision, primary reason, total return, Sharpe, max drawdown, and suggested action, followed by the "Full Research Memo" expander.
   - Click **Save Experiment Artifacts** (or **Save** in the toolbar).
   - Verify the generated Markdown and JSON files are stored in the `reports/experiments/` folder.


