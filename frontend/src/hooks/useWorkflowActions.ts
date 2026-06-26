import { apiClient } from '../api/client';
import { useResearchStore } from '../state/researchStore';
import { buildResearchReportInput } from '../utils/reportInput';

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useWorkflowActions() {
  const store = useResearchStore();

  const generateData = async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      await apiClient.generateData({
        days: store.days,
        seed: store.seed,
        scenario: store.scenario,
        output_path: store.dataPath,
      });
      store.setDataGenerated(true);
      store.setValidation(null);
      store.setBacktestResult(null);
      store.setRiskReview(null);
      store.setReport(null);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to generate data'));
    } finally {
      store.setLoading(false);
    }
  };

  const generateIdea = async () => {
    if (!store.userPrompt.trim()) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.generateAlpha({
        user_prompt: store.userPrompt,
        preferred_style: store.preferredStyle,
      });
      store.setAlphaIdea(res);
      store.setAlphaFormula(res.idea.formula);
      store.setValidation(res.validation);
      store.setBacktestResult(null);
      store.setRiskReview(null);
      store.setReport(null);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to generate alpha idea'));
    } finally {
      store.setLoading(false);
    }
  };

  const validateFormula = async () => {
    if (!store.dataGenerated || !store.alphaFormula.trim()) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.evaluateAlpha({
        formula: store.alphaFormula,
        data_path: store.dataPath,
      });
      store.setValidation(res);
      store.setBacktestResult(null);
      store.setRiskReview(null);
      store.setReport(null);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to evaluate formula'));
    } finally {
      store.setLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!store.dataGenerated || !store.alphaFormula.trim() || !store.validation?.is_valid) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.runBacktest({
        formula: store.alphaFormula,
        data_path: store.dataPath,
        mode: store.signalMode,
        upper_quantile: store.upperQuantile,
        lower_quantile: store.lowerQuantile,
        transaction_cost: store.transactionCost,
        slippage: store.slippage,
      });
      store.setBacktestResult(res);
      store.setRiskReview(null);
      store.setReport(null);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to run backtest'));
    } finally {
      store.setLoading(false);
    }
  };

  const reviewRisk = async () => {
    if (!store.backtestResult) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.evaluateRisk({
        metrics: store.backtestResult.metrics,
      });
      store.setRiskReview(res);
      store.setReport(null);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to review risk'));
    } finally {
      store.setLoading(false);
    }
  };

  const generateMemo = async () => {
    if (!store.alphaFormula.trim() || !store.backtestResult || !store.riskReview) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.generateReport(
        buildResearchReportInput({
          ...store,
          backtestResult: store.backtestResult,
          riskReview: store.riskReview,
        })
      );
      store.setReport(res);
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to generate report'));
    } finally {
      store.setLoading(false);
    }
  };

  const saveArtifacts = async () => {
    if (!store.alphaFormula.trim() || !store.backtestResult || !store.riskReview || !store.report) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const res = await apiClient.saveExperiment(
        buildResearchReportInput({
          ...store,
          backtestResult: store.backtestResult,
          riskReview: store.riskReview,
        })
      );
      store.addSavedArtifact(res);
      store.setActiveTab('Artifacts');
    } catch (err) {
      store.setError(getErrorMessage(err, 'Failed to save artifacts'));
    } finally {
      store.setLoading(false);
    }
  };

  return { generateData, generateIdea, validateFormula, runBacktest, reviewRisk, generateMemo, saveArtifacts };
}