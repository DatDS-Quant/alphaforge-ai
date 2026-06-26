import type {
  AlphaEvaluateResponse,
  AlphaGenerateResponse,
  BacktestRunResponse,
  ReportGenerateRequest,
  RiskEvaluateResponse,
} from '../api/types';

interface BuildResearchReportInputArgs {
  days: number;
  seed: number;
  scenario: string;
  dataPath: string;
  alphaFormula: string;
  signalMode: string;
  upperQuantile: number;
  lowerQuantile: number;
  transactionCost: number;
  slippage: number;
  alphaIdea: AlphaGenerateResponse | null;
  validation: AlphaEvaluateResponse | null;
  backtestResult: BacktestRunResponse;
  riskReview: RiskEvaluateResponse;
}

export function buildResearchReportInput({
  days,
  seed,
  scenario,
  dataPath,
  alphaFormula,
  signalMode,
  upperQuantile,
  lowerQuantile,
  transactionCost,
  slippage,
  alphaIdea,
  validation,
  backtestResult,
  riskReview,
}: BuildResearchReportInputArgs): ReportGenerateRequest {
  const idea = alphaIdea?.idea;
  const reportValidation: AlphaEvaluateResponse = validation || {
    is_valid: true,
    errors: [],
    warnings: [],
    referenced_columns: [],
    referenced_operators: [],
    alpha_preview: null,
  };

  return {
    title: idea?.title || 'Manual Formula Research Memo',
    hypothesis:
      idea?.hypothesis ||
      'This memo evaluates a manually supplied single-asset alpha signal formula under the current synthetic research configuration.',
    formula: idea?.formula || alphaFormula,
    required_columns: idea?.required_columns || reportValidation.referenced_columns || [],
    expected_behavior:
      idea?.expected_behavior ||
      'The signal behavior is inferred from the validated formula and evaluated through vectorized backtesting.',
    risk_notes:
      idea?.risk_notes || [
        'This memo was generated from a manual formula without a prior generated research idea.',
        'Results are synthetic research outputs, not real-market evidence.',
      ],
    explanation:
      idea?.explanation ||
      'No generated research explanation is available because the workflow started from a manual formula.',
    validation: reportValidation,
    metrics: backtestResult.metrics,
    risk_decision: riskReview,
    backtest_config: {
      days,
      seed,
      scenario,
      data_path: dataPath,
      formula: alphaFormula,
      mode: signalMode,
      upper_quantile: upperQuantile,
      lower_quantile: lowerQuantile,
      transaction_cost: transactionCost,
      slippage,
    },
  };
}