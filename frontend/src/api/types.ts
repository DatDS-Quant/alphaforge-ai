export interface DataGenerateRequest {
  days: number;
  seed: number;
  scenario: string;
  output_path: string;
}

export interface DataGenerateResponse {
  message: string;
}

export interface AgentTrace {
  detected_theme: string;
  formula_template_selected: string;
  validation_status: string;
  warnings: string[];
}

export interface AlphaGenerateRequest {
  user_prompt: string;
  preferred_style: string;
}

export interface AlphaGenerateResponse {
  title: string;
  hypothesis: string;
  formula: string;
  required_columns: string[];
  expected_behavior: string;
  risk_notes: string;
  explanation: string;
  warnings: string[];
  trace: AgentTrace;
}

export interface AlphaEvaluateRequest {
  formula: string;
  data_path: string;
}

export interface AlphaEvaluateResponse {
  status: 'VALID' | 'INVALID';
  error: string | null;
  referenced_columns: string[];
  referenced_operators: string[];
}

export interface BacktestMetrics {
  total_return: number;
  annualized_return: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
  win_rate: number;
  profit_factor: number;
  turnover: number;
  number_of_trades: number;
  buy_hold_total_return: number;
  strategy_excess_return_vs_buy_hold: number;
  strategy_correlation_to_asset_return: number;
  exposure_ratio: number;
}

export interface BacktestRunRequest {
  formula: string;
  data_path: string;
  signal_mode: string;
  upper_quantile: number;
  lower_quantile: number;
  transaction_cost: number;
  slippage: number;
}

export interface BacktestRunResponse {
  metrics: BacktestMetrics;
  equity_curve: number[];
  drawdown: number[];
  buy_hold_equity_curve: number[];
  dates: string[];
  signals: number[];
  prices: number[];
  strategy_returns: number[];
}

export interface RiskEvaluateRequest {
  metrics: BacktestMetrics;
  risk_rules_config?: {
    max_drawdown_limit?: number;
    min_trades_limit?: number;
    max_turnover_limit?: number;
    min_sharpe_limit?: number;
  };
}

export interface RiskEvaluateResponse {
  decision: 'APPROVE' | 'REDUCE' | 'REJECT';
  recommended_scale: number;
  reasons: string[];
  rule_findings: {
    max_drawdown: string;
    number_of_trades: string;
    sharpe: string;
    turnover: string;
  };
}

export interface BacktestConfig {
  days: number;
  seed: number;
  scenario: string;
  formula: string;
  signal_mode: string;
  upper_quantile: number;
  lower_quantile: number;
  transaction_cost: number;
  slippage: number;
}

export interface ReportGenerateRequest {
  title: string;
  hypothesis: string;
  formula: string;
  required_columns: string[];
  expected_behavior: string;
  risk_notes: string;
  explanation: string;
  validation: AlphaEvaluateResponse;
  metrics: BacktestMetrics;
  risk_decision: RiskEvaluateResponse;
  backtest_config: BacktestConfig;
}

export interface ReportGenerateResponse {
  title: string;
  summary: string;
  report_markdown: string;
  limitations: string[];
  next_steps: string[];
}

export interface ExperimentSaveResponse {
  experiment_id: string;
  report_path: string;
  metadata_path: string;
  created_at: string;
}
