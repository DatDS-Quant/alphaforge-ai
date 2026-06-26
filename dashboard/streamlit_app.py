import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import streamlit as st
import yaml

from app.agents.report_schemas import ResearchReportInput
from app.agents.report_service import generate_research_report, save_research_experiment
from app.agents.service import generate_and_validate_alpha_idea
from app.core.backtester.engine import run_backtest
from app.core.expression_engine.evaluator import evaluate_expression
from app.core.expression_engine.validator import validate_expression
from app.core.metrics.performance import calculate_performance_metrics
from app.core.risk.rules import evaluate_risk
from app.data.loader import load_ohlcv
from app.data.sample_generator import generate_sample_data

# Page configuration - strictly plain text, no emojis
st.set_page_config(page_title="AlphaForge AI Dashboard", layout="wide")

# Load configuration if available
config = {}
config_path = "configs/default.yaml"
if os.path.exists(config_path):
    try:
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
    except Exception:
        pass

# Extract config defaults
cfg_generator = config.get("data_generator", {})
cfg_backtester = config.get("backtester", {})

default_days = cfg_generator.get("days", 1000)
default_seed = cfg_generator.get("seed", 42)
default_path = cfg_generator.get("output_path", "data/sample_ohlcv.csv")

default_mode = cfg_backtester.get("mode", "long_short")
default_upper = cfg_backtester.get("default_upper_quantile", 0.7)
default_lower = cfg_backtester.get("default_lower_quantile", 0.3)
default_cost = cfg_backtester.get("transaction_cost", 0.0005)
default_slippage = cfg_backtester.get("slippage", 0.0005)

# Application state initialization
if "ohlcv_df" not in st.session_state:
    st.session_state["ohlcv_df"] = None
if "backtest_df" not in st.session_state:
    st.session_state["backtest_df"] = None
if "metrics" not in st.session_state:
    st.session_state["metrics"] = None
if "risk_result" not in st.session_state:
    st.session_state["risk_result"] = None
if "generated_formula" not in st.session_state:
    st.session_state["generated_formula"] = "rank(momentum(close, 20))"
if "generated_idea" not in st.session_state:
    st.session_state["generated_idea"] = None
if "generated_report" not in st.session_state:
    st.session_state["generated_report"] = None
if "saved_artifact" not in st.session_state:
    st.session_state["saved_artifact"] = None


# Sidebar parameters
st.sidebar.title("AlphaForge AI Configuration")

with st.sidebar.expander("Data Settings", expanded=True):
    days = st.number_input(
        "Days to Generate", min_value=10, max_value=5000, value=default_days, step=100
    )
    seed = st.number_input("Random Seed", min_value=0, max_value=100000, value=default_seed, step=1)
    scenario = st.selectbox(
        "Synthetic Scenario",
        ["random_walk", "trend_up", "trend_down", "mean_reverting", "volatile"],
        index=0,
    )
    data_path = st.text_input("Data File Path", value=default_path)

with st.sidebar.expander("Alpha and Signal Settings", expanded=True):
    formula = st.text_area("Alpha Formula", value=st.session_state["generated_formula"], height=100)
    signal_mode = st.selectbox(
        "Signal Mode", ["long_short", "long_flat"], index=0 if default_mode == "long_short" else 1
    )
    upper_q = st.slider(
        "Upper Quantile Threshold", min_value=0.5, max_value=1.0, value=default_upper, step=0.05
    )
    lower_q = st.slider(
        "Lower Quantile Threshold", min_value=0.0, max_value=0.5, value=default_lower, step=0.05
    )

with st.sidebar.expander("Execution Cost Settings", expanded=True):
    transaction_cost = st.number_input(
        "Transaction Cost Rate", min_value=0.0, max_value=0.05, value=default_cost, format="%.6f"
    )
    slippage = st.number_input(
        "Slippage Rate", min_value=0.0, max_value=0.05, value=default_slippage, format="%.6f"
    )

st.sidebar.subheader("Actions")
btn_generate = st.sidebar.button("Generate Sample Data")
btn_backtest = st.sidebar.button("Run Backtest")
btn_risk = st.sidebar.button("Review Risk")

# Handle Generation Action
if btn_generate:
    try:
        dir_name = os.path.dirname(data_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        df_gen = generate_sample_data(days=days, seed=seed, scenario=scenario)
        df_gen.to_csv(data_path, index=False)
        st.session_state["ohlcv_df"] = df_gen
        st.sidebar.success(f"Success: Generated {len(df_gen)} rows ({scenario}) at {data_path}")
    except Exception as e:
        st.sidebar.error(f"Error generating data: {str(e)}")

# Handle Backtest Action (runs backtest and updates metrics + risk state)
if btn_backtest:
    st.session_state["generated_report"] = None
    st.session_state["saved_artifact"] = None
    # 1. Validate formula
    val_res = validate_expression(formula)
    if not val_res.is_valid:
        st.sidebar.error(f"Invalid Formula: {'; '.join(val_res.errors)}")
    else:
        # 2. Check if data exists, load it
        if not os.path.exists(data_path):
            st.sidebar.warning("Data file not found. Auto-generating sample data first...")
            try:
                df_gen = generate_sample_data(days=days, seed=seed, scenario=scenario)
                os.makedirs(os.path.dirname(data_path) or ".", exist_ok=True)
                df_gen.to_csv(data_path, index=False)
                st.session_state["ohlcv_df"] = df_gen
            except Exception as e:
                st.sidebar.error(f"Failed to generate data: {str(e)}")

        if os.path.exists(data_path):
            try:
                df_load = load_ohlcv(data_path)
                st.session_state["ohlcv_df"] = df_load

                # 3. Evaluate expression
                alpha = evaluate_expression(formula, df_load)

                # 4. Run Backtest
                bt_res = run_backtest(
                    df=df_load,
                    alpha=alpha,
                    mode=signal_mode,
                    upper_quantile=upper_q,
                    lower_quantile=lower_q,
                    transaction_cost=transaction_cost,
                    slippage=slippage,
                )
                st.session_state["backtest_df"] = bt_res

                # 5. Compute metrics
                metrics = calculate_performance_metrics(bt_res)
                st.session_state["metrics"] = metrics

                # 6. Pre-calculate risk checks automatically
                risk = evaluate_risk(metrics)
                st.session_state["risk_result"] = risk

                # Conditional success message
                decision = risk.get("decision", "REJECT")
                if decision == "REJECT":
                    st.sidebar.error("Backtest completed. Risk decision: REJECT.")
                elif decision == "REDUCE":
                    st.sidebar.warning("Backtest completed. Risk decision: REDUCE.")
                else:  # APPROVE
                    st.sidebar.success("Backtest completed. Risk decision: APPROVE.")
            except Exception as e:
                st.sidebar.error(f"Backtest failed: {str(e)}")

# Handle Risk Review Action separately if requested
if btn_risk:
    st.session_state["generated_report"] = None
    st.session_state["saved_artifact"] = None
    if st.session_state["metrics"] is None:

        st.sidebar.error("Error: Please run the backtest first before reviewing risk.")
    else:
        try:
            risk = evaluate_risk(st.session_state["metrics"])
            st.session_state["risk_result"] = risk
            st.sidebar.success("Success: Risk review completed")
        except Exception as e:
            st.sidebar.error(f"Risk review failed: {str(e)}")

# Main Dashboard View
st.title("AlphaForge AI Quant Research Platform")
st.text("Quant Research, Backtesting, and Risk Management Interface")

# Compact Workflow Status Panel
st.write("")
st.write("**Workflow Status Panel**")
col_s1, col_s2, col_s3, col_s4, col_s5, col_s6 = st.columns(6)

idea_status = "Generated" if st.session_state.get("generated_idea") is not None else "Empty"
data_status = "Available" if st.session_state.get("ohlcv_df") is not None else "Not Generated"
backtest_status = "Completed" if st.session_state.get("backtest_df") is not None else "Pending"
risk_status = (
    st.session_state["risk_result"]["decision"]
    if st.session_state.get("risk_result") is not None
    else "Pending"
)
report_status = "Generated" if st.session_state.get("generated_report") is not None else "Pending"
artifact_status = "Saved" if st.session_state.get("saved_artifact") is not None else "Not Saved"

with col_s1:
    st.write(f"Alpha Idea: **{idea_status}**")
with col_s2:
    st.write(f"Data Path: **{data_status}**")
with col_s3:
    st.write(f"Backtest: **{backtest_status}**")
with col_s4:
    st.write(f"Risk Decision: **{risk_status}**")
with col_s5:
    st.write(f"Report: **{report_status}**")
with col_s6:
    st.write(f"Artifact: **{artifact_status}**")
st.write("---")

# Tabs definition - standard ASCII names, no emojis
tab_ai, tab_formula, tab_backtest, tab_risk, tab_report = st.tabs(
    ["AI Alpha Research Desk", "Alpha Formula", "Backtest Lab", "Risk Review", "Research Report"]
)

# AI Tab
with tab_ai:
    st.header("AI Alpha Research Desk")
    st.write("Enter your natural-language trading concept to generate a structured alpha formula.")

    # Prompt text area
    user_prompt = st.text_area(
        "Your Alpha Concept", value="Find a momentum alpha confirmed by abnormal volume"
    )

    # Style selector
    preferred_style = st.selectbox(
        "Research Framing Style", options=["balanced", "conservative", "aggressive"], index=0
    )

    btn_ai = st.button("Generate Alpha Idea")

    if btn_ai:
        if len(user_prompt.strip()) < 3:
            st.error("Error: Concept prompt must be at least 3 characters long.")
        else:
            try:
                # Generate idea
                idea_res = generate_and_validate_alpha_idea(user_prompt, preferred_style)
                st.session_state["generated_idea"] = idea_res
                st.session_state["generated_formula"] = idea_res.idea.formula
                st.success(
                    "Success: Alpha idea generated! Check the sidebar and other tabs to review."
                )
                # Force rerun so sidebar formula value updates immediately
                if hasattr(st, "rerun"):
                    st.rerun()
                else:
                    st.experimental_rerun()
            except Exception as e:
                st.error(f"Generation error: {str(e)}")

    # Display current idea if exists
    if st.session_state["generated_idea"] is not None:
        idea_res = st.session_state["generated_idea"]
        idea = idea_res.idea

        st.subheader(f"Title: {idea.title}")
        st.text(f"Formula: {idea.formula}")

        st.write("Hypothesis:")
        st.write(idea.hypothesis)

        st.write("Expected Behavior:")
        st.write(idea.expected_behavior)

        st.write("Required Columns:")
        st.write(idea.required_columns)

        st.write("Risk Notes:")
        for note in idea.risk_notes:
            st.write(f"- {note}")

        st.write("Explanation:")
        st.write(idea.explanation)

        st.write("Tags:")
        st.write(", ".join(idea.tags))

        # Formula validation
        st.subheader("AST Validation Status")
        if idea_res.validation.is_valid:
            st.write("Validation Status: VALID")
        else:
            st.write("Validation Status: INVALID")
            for err in idea_res.validation.errors:
                st.write(f"- {err}")

        # Warnings
        if idea_res.warnings:
            st.subheader("Research Warnings")
            for wrn in idea_res.warnings:
                st.write(f"- {wrn}")

        # Agent Trace Panel
        st.write("")
        st.write("**Agent Trace Logs**")
        st.write(f"- Detected Theme: **{idea_res.trace.detected_theme}**")
        st.write(f"- Formula Template Selected: **{idea_res.trace.formula_template}**")
        st.write(f"- Validation Status: **{idea_res.trace.validation_status}**")
        if idea_res.trace.warnings:
            st.write("- Warnings/Logs:")
            for wrn in idea_res.trace.warnings:
                st.write(f"  - {wrn}")

# 1. Formula Tab
with tab_formula:
    st.header("Alpha Expression Validator")
    val_res = validate_expression(formula)

    if val_res.is_valid:
        st.subheader("Validation Result: VALID")
        st.text(f"Formula: {formula}")

        st.write("Referenced Columns:")
        st.write(val_res.referenced_columns)

        st.write("Referenced Operators:")
        st.write(val_res.referenced_operators)

        # Display preview if backtest completed
        if st.session_state["backtest_df"] is not None:
            st.subheader("Alpha Value Preview (Recent Rows)")
            preview_cols = ["date", "close", "alpha", "signal"]
            st.dataframe(st.session_state["backtest_df"][preview_cols].tail(10))
    else:
        st.subheader("Validation Result: INVALID")
        st.write("Errors:")
        for err in val_res.errors:
            st.write(f"- {err}")

# 2. Backtest Tab
with tab_backtest:
    st.header("Backtest Results")

    if st.session_state["backtest_df"] is not None and st.session_state["metrics"] is not None:
        bt_df = st.session_state["backtest_df"]
        metrics = st.session_state["metrics"]

        # Format metrics table
        metrics_display = {
            "Total Return": f"{metrics['total_return'] * 100:.2f}%",
            "Annualized Return": f"{metrics['annualized_return'] * 100:.2f}%",
            "Sharpe Ratio": f"{metrics['sharpe']:.2f}",
            "Sortino Ratio": f"{metrics['sortino']:.2f}",
            "Max Drawdown": f"{metrics['max_drawdown'] * 100:.2f}%",
            "Win Rate": f"{metrics['win_rate'] * 100:.2f}%",
            "Profit Factor": f"{metrics['profit_factor']:.2f}",
            "Turnover": f"{metrics['turnover']:.4f}",
            "Number of Trades": int(metrics["number_of_trades"]),
            "Buy & Hold Total Return": f"{metrics.get('buy_hold_total_return', 0.0) * 100:.2f}%",
            "Strategy Excess Return vs Benchmark": f"{metrics.get('strategy_excess_return_vs_buy_hold', 0.0) * 100:.2f}%",
            "Strategy Correlation to Asset": f"{metrics.get('strategy_correlation_to_asset_return', 0.0):.4f}",
            "Exposure Ratio": f"{metrics.get('exposure_ratio', 0.0) * 100:.2f}%",
        }

        col_metrics, col_info = st.columns([1, 2])
        with col_metrics:
            st.subheader("Performance Metrics")
            st.table(pd.Series(metrics_display, name="Value"))

        with col_info:
            st.subheader("Asset and Signal Stats")
            st.write(f"Total Trading Days: {len(bt_df)}")
            if len(bt_df) > 0:
                st.write(f"Start Date: {bt_df['date'].iloc[0].strftime('%Y-%m-%d')}")
                st.write(f"End Date: {bt_df['date'].iloc[-1].strftime('%Y-%m-%d')}")
            st.text("Note: Benchmark comparison uses the same synthetic single-asset price path.")

        # Line charts
        st.subheader("Equity Curve")
        chart_df = bt_df.set_index("date")
        st.line_chart(chart_df[["equity_curve", "buy_hold_equity_curve"]])

        st.subheader("Drawdown Profile")
        st.line_chart(chart_df["drawdown"])

        # Signals Table
        st.subheader("Recent Trading Signals (Last 20 Rows)")
        sig_cols = [
            "date",
            "close",
            "return",
            "alpha",
            "signal",
            "trade",
            "strategy_return",
            "equity_curve",
        ]
        st.dataframe(bt_df[sig_cols].tail(20).reset_index(drop=True))
    else:
        st.info(
            "No active backtest results found. Click 'Run Backtest' in the sidebar to generate data."
        )

# 3. Risk Tab
with tab_risk:
    st.header("Post-Backtest Risk Review")

    if st.session_state["risk_result"] is not None:
        risk = st.session_state["risk_result"]

        st.write(f"**Risk Decision: {risk['decision']}**")
        st.write(f"Recommended Position Scale: {risk['recommended_position_scale']}")

        st.write("**Rule Findings**")
        for reason in risk["reasons"]:
            st.write(f"- {reason}")

        st.write("")
        st.write("**Disclaimer**")
        st.text(risk["disclaimer"])
    else:
        st.info(
            "No active risk review found. Run a backtest in the sidebar to evaluate risk guidelines."
        )

# 4. Research Report Tab
with tab_report:
    st.header("Alpha Research Report")

    # Check if necessary data is available
    metrics_val = st.session_state.get("metrics")
    risk_result_val = st.session_state.get("risk_result")

    if metrics_val is None or risk_result_val is None:
        st.info("Required data is missing. Please follow these steps:")
        st.text(
            "1. Generate an alpha idea or enter a formula.\n"
            "2. Run backtest.\n"
            "3. Review risk.\n"
            "4. Generate report."
        )
    else:
        # Check if we can use the generated idea
        idea_response = st.session_state.get("generated_idea")
        use_generated = False
        if idea_response is not None and idea_response.idea.formula == formula:
            use_generated = True

        if use_generated:
            idea = idea_response.idea
            title_val = idea.title
            hypothesis_val = idea.hypothesis
            required_cols_val = idea.required_columns
            expected_behavior_val = idea.expected_behavior
            risk_notes_val = idea.risk_notes
            explanation_val = idea.explanation
            if hasattr(idea_response.validation, "model_dump"):
                validation_val = idea_response.validation.model_dump()
            else:
                validation_val = idea_response.validation.dict()
        else:
            # Fallback for manual workflow
            title_val = f"Research Report: {formula}"
            hypothesis_val = f"Quantitative analysis of mathematical alpha formula `{formula}`."
            val_res = validate_expression(formula)
            required_cols_val = val_res.referenced_columns if val_res.is_valid else ["close"]
            expected_behavior_val = "Directional trading signal based on threshold quantiles."
            risk_notes_val = [
                "Manual entry: risk parameters must be verified under multiple regimes."
            ]
            explanation_val = f"This formula was manually entered: `{formula}` and evaluated."
            if hasattr(val_res, "model_dump"):
                validation_val = val_res.model_dump()
            else:
                validation_val = val_res.dict()

        # Build backtest config
        backtest_config_val = {
            "data_path": data_path,
            "mode": signal_mode,
            "upper_quantile": upper_q,
            "lower_quantile": lower_q,
            "transaction_cost": transaction_cost,
            "slippage": slippage,
        }

        # Build ResearchReportInput
        report_input = ResearchReportInput(
            title=title_val,
            hypothesis=hypothesis_val,
            formula=formula,
            required_columns=required_cols_val,
            expected_behavior=expected_behavior_val,
            risk_notes=risk_notes_val,
            explanation=explanation_val,
            validation=validation_val,
            metrics=metrics_val,
            risk_decision=risk_result_val,
            backtest_config=backtest_config_val,
        )

        col_buttons = st.columns(2)
        with col_buttons[0]:
            btn_gen_report = st.button("Generate Research Report")
            if btn_gen_report:
                try:
                    report = generate_research_report(report_input)
                    st.session_state["generated_report"] = report
                    st.session_state["saved_artifact"] = None  # Reset saved status
                    st.success("Success: Research Report generated successfully.")
                except Exception as e:
                    st.error(f"Failed to generate report: {str(e)}")

        with col_buttons[1]:
            # Show save button if report is already generated
            if st.session_state.get("generated_report") is not None:
                btn_save_artifact = st.button("Save Experiment Artifacts")
                if btn_save_artifact:
                    try:
                        artifact = save_research_experiment(report_input)
                        st.session_state["saved_artifact"] = artifact
                        st.success("Success: Experiment artifacts saved successfully.")
                    except Exception as e:
                        st.error(f"Failed to save experiment: {str(e)}")

        # If report exists, display Research Verdict and full report expander
        report = st.session_state.get("generated_report")
        if report is not None:
            decision = report_input.risk_decision.get("decision", "REJECT")
            reasons = report_input.risk_decision.get("reasons", [])
            top_reason = reasons[0] if reasons else "Passed basic checks."
            total_return = report_input.metrics.get("total_return", 0.0)
            sharpe = report_input.metrics.get("sharpe", 0.0)
            max_drawdown = report_input.metrics.get("max_drawdown", 0.0)

            # Map suggested action
            if decision == "REJECT":
                suggested_action = "Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests."
            elif decision == "REDUCE":
                suggested_action = (
                    "Use reduced sizing only under simplified assumptions and run robustness tests."
                )
            else:  # APPROVE
                suggested_action = "Approved only under simplified synthetic and vectorized assumptions. Validate further before any real-world use."

            st.write("")
            st.write("**Research Verdict**")
            st.write(f"- Decision: **{decision}**")
            st.write(f"- Top Reason: **{top_reason}**")
            st.write(f"- Total Return: **{total_return * 100:.2f}%**")
            st.write(f"- Sharpe: **{sharpe:.2f}**")
            st.write(f"- Max Drawdown: **{max_drawdown * 100:.2f}%**")
            st.write(f"- Suggested Action: **{suggested_action}**")
            st.write("")

            with st.expander("Full Research Memo", expanded=False):
                st.markdown(report.report_markdown)

        # If artifact exists, display paths
        artifact = st.session_state.get("saved_artifact")
        if artifact is not None:
            st.write("")
            st.write("**Saved Artifact Details**")
            st.write(f"- Experiment ID: **{artifact.experiment_id}**")
            st.write(f"- Report Path: **{artifact.report_path}**")
            st.write(f"- Metadata Path: **{artifact.metadata_path}**")
