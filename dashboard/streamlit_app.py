import os

import pandas as pd
import streamlit as st
import yaml

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

# Sidebar parameters
st.sidebar.title("AlphaForge AI Configuration")

st.sidebar.subheader("Data Generation Settings")
days = st.sidebar.number_input(
    "Days to Generate", min_value=10, max_value=5000, value=default_days, step=100
)
seed = st.sidebar.number_input(
    "Random Seed", min_value=0, max_value=100000, value=default_seed, step=1
)
data_path = st.sidebar.text_input("Data File Path", value=default_path)

st.sidebar.subheader("Alpha & Backtest Settings")
formula = st.sidebar.text_input("Alpha Formula", value=st.session_state["generated_formula"])
signal_mode = st.sidebar.selectbox(
    "Signal Mode", ["long_short", "long_flat"], index=0 if default_mode == "long_short" else 1
)
upper_q = st.sidebar.slider(
    "Upper Quantile Threshold", min_value=0.5, max_value=1.0, value=default_upper, step=0.05
)
lower_q = st.sidebar.slider(
    "Lower Quantile Threshold", min_value=0.0, max_value=0.5, value=default_lower, step=0.05
)
transaction_cost = st.sidebar.number_input(
    "Transaction Cost Rate", min_value=0.0, max_value=0.05, value=default_cost, format="%.6f"
)
slippage = st.sidebar.number_input(
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
        df_gen = generate_sample_data(days=days, seed=seed)
        df_gen.to_csv(data_path, index=False)
        st.session_state["ohlcv_df"] = df_gen
        st.sidebar.success(f"Success: Generated {len(df_gen)} rows at {data_path}")
    except Exception as e:
        st.sidebar.error(f"Error generating data: {str(e)}")

# Handle Backtest Action (runs backtest and updates metrics + risk state)
if btn_backtest:
    # 1. Validate formula
    val_res = validate_expression(formula)
    if not val_res.is_valid:
        st.sidebar.error(f"Invalid Formula: {'; '.join(val_res.errors)}")
    else:
        # 2. Check if data exists, load it
        if not os.path.exists(data_path):
            st.sidebar.warning("Data file not found. Auto-generating sample data first...")
            try:
                df_gen = generate_sample_data(days=days, seed=seed)
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

                st.sidebar.success("Success: Backtest and risk checks completed")
            except Exception as e:
                st.sidebar.error(f"Backtest failed: {str(e)}")

# Handle Risk Review Action separately if requested
if btn_risk:
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

# Tabs definition - standard ASCII names, no emojis
tab_ai, tab_formula, tab_backtest, tab_risk = st.tabs(
    ["AI Alpha Research Desk", "Alpha Formula", "Backtest Lab", "Risk Review"]
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

        # Line charts
        st.subheader("Equity Curve")
        chart_df = bt_df.set_index("date")
        st.line_chart(chart_df["equity_curve"])

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

        st.subheader(f"Risk Decision: {risk['decision']}")
        st.write(f"Recommended Position Scale: {risk['recommended_position_scale']}")

        st.subheader("Rule Findings")
        for reason in risk["reasons"]:
            st.write(f"- {reason}")

        st.subheader("Disclaimer")
        st.text(risk["disclaimer"])
    else:
        st.info(
            "No active risk review found. Run a backtest in the sidebar to evaluate risk guidelines."
        )
