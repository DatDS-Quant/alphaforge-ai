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
cd app/frontend
npm install
npm run dev
```

This opens a browser tab at http://localhost:5173 with seven professional workspace tabs: Home, Research Desk, Formula Lab, Backtest, Risk, Memo, and Artifacts.

## Manual QA Script

### Scenario A: Generated Idea Mode

1. Generate data from the Left Rail or Home panel.
2. Open Research Desk.
3. Enter a prompt and click "Generate Research Idea".
4. Open Formula Lab and click "Validate Formula".
5. Open Backtest and click "Run Backtest".
6. Open Risk and click "Review Risk".
7. Open Memo and click "Compile Research Memo".
8. Click "Save Experiment Artifacts".
9. Open Artifacts and verify the session artifact paths are shown.

### Scenario B: Manual Formula Mode

1. Do not generate a research idea.
2. Enter a formula manually in the Left Rail or Formula Lab, for example `rank(momentum(close, 20))`.
3. Generate data from the Left Rail, Home, Formula Lab, or Backtest prerequisite panel.
4. Open Formula Lab and click "Validate Formula".
5. Open Backtest and click "Run Backtest".
6. Open Risk and click "Review Risk".
7. Open Memo and click "Compile Research Memo" in manual formula mode.
8. Click "Save Experiment Artifacts".
9. Open Artifacts and verify the session artifact paths are shown.

A REJECT risk decision is still a valid research result and should still support memo generation.
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
   - In the Left Rail, set **Scenario** to `random_walk` or `volatile` and click **Generate Data**.
   - Go to the **Research Desk** page and enter a prompt: "Find a momentum alpha".
   - Click **Generate Research Idea** .
   - Go to the **Backtest** page and click **Run Backtest** .
   - Review the results. If the strategy suffers from severe drawdowns (e.g. drawdown exceeds -25%) or lacks sufficient trade volume under these market conditions, navigate to the **Risk** tab. The status strip at the top will indicate **RISK: REJECT** (or REDUCE).
   - In the **Memo** page, click **Compile Research Memo**  to see the suggested action: "Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests."

2. **Step 2: Strategy Sizing / Approval Demonstration**
   - In the Left Rail, change **Scenario** to `trend_up`. click **Generate Data**. (A strong positive drift is highly favorable to momentum signals).
   - Navigate to the **Backtest** page and click **Run Backtest** .
   - The strategy return should be significantly improved. Navigate to the **Risk** tab. The status strip at the top will show **RISK: APPROVE** or **REDUCE**.
   - Review the metrics tiles and tables comparing strategy returns against the baseline buy-and-hold benchmark return.

3. **Step 3: Generate and Save Experiment Artifacts**
   - Navigate to the **Memo** page.
   - Click **Compile Research Memo** . Notice that the report begins with a clear **Research Verdict** outlining the decision, primary reason, total return, Sharpe, max drawdown, and suggested action, followed by the "Full Research Memo" expander.
   - Click **Save Experiment Artifacts** .
   - Verify the generated Markdown and JSON files are stored in the `reports/experiments/` folder.

## Manual QA Script

### Scenario A: Generated Idea Workflow

1. Navigate to the **Home** or **Formula Lab** page and click **Generate Data** (or do this from the Left Rail).
2. Verify that the status strip updates to show **DATA: READY**.
3. Open the **Research Desk** page.
4. Enter the prompt `"Find a momentum alpha confirmed by abnormal volume"` and select the style `balanced`.
5. Click **Generate Research Idea** directly under the inputs.
6. Wait for the quantitative proposal details and trace to render. Confirm that the status strip shows **IDEA: READY**.
7. Navigate to the **Formula Lab** page.
8. Click **Validate Formula** to execute AST compliance. Verify that validation status shows **VALID**.
9. Navigate to the **Backtest** page.
10. Click **Run Backtest** (or use the button in the panel header). Wait for charts and metrics to render. Verify the status strip shows **BACKTEST: COMPLETED**.
11. Navigate to the **Risk** page.
12. Click **Review Risk** (or use the button in the panel header). Verify that compliance rule findings and verdict scale render.
13. Navigate to the **Memo** page.
14. Click **Compile Research Memo** (or use the button in the panel header).
15. Verify that the executive summary, verdict, and full report markdown render.
16. Click **Save Experiment Artifacts** under the Disk Serialization section.
17. Verify that the complete success message displays.
18. Go to the **Artifacts** page and check that the paths and metadata preview are successfully loaded.

### Scenario B: Manual Formula Workflow

1. Open the **Formula Lab** or use the Left Rail.
2. In the active formula input (Left Rail or Formula Lab editor), manually enter a formula (e.g., `-zscore(close, 20)`).
3. Click **Generate Data** in the Left Rail or Home tab if not generated yet.
4. Navigate to the **Formula Lab** page.
5. Click **Validate Formula** and verify validation succeeds.
6. Navigate to the **Backtest** page.
7. Click **Run Backtest** and wait for simulation curves to load.
8. Navigate to the **Risk** page.
9. Click **Review Risk** and verify that compliance rule findings show.
10. Navigate to the **Memo** page.
11. Confirm that you can click **Compile Research Memo** directly even though no research idea was generated.
12. Verify that the fallback fields load (e.g., Title shows "Manual Formula Research Memo").
13. Click **Save Experiment Artifacts**.
14. Navigate to the **Artifacts** page and verify the metadata preview loads correctly.


