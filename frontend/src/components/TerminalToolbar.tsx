import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';

export const TerminalToolbar: React.FC = () => {
  const {
    scenario, setScenario,
    signalMode, setSignalMode,
    dataPath, setDataPath,
    alphaFormula, setAlphaFormula,
    days, seed, upperQuantile, lowerQuantile, transactionCost, slippage,
    userPrompt, preferredStyle,
    
    dataGenerated, setDataGenerated,
    backtestResult, setBacktestResult,
    riskReview, setRiskReview,
    report, setReport,
    addSavedArtifact,
    alphaIdea, setAlphaIdea,
    validation, setValidation,

    loading, setLoading,
    setError, setActiveTab, resetAll,
  } = useResearchStore();

  const handleGenerateData = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.generateData({
        days,
        seed,
        scenario,
        output_path: dataPath,
      });
      setDataGenerated(true);
      resetAll();
      setActiveTab('Formula Lab');
    } catch (err: any) {
      setError(err.message || 'Failed to generate data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdea = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.generateAlpha({
        user_prompt: userPrompt,
        preferred_style: preferredStyle,
      });
      setAlphaIdea(res);
      setAlphaFormula(res.formula);
      setValidation(null);
      setActiveTab('Research Desk');
    } catch (err: any) {
      setError(err.message || 'Failed to generate idea');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBacktest = async () => {
    if (!dataGenerated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.runBacktest({
        formula: alphaFormula,
        data_path: dataPath,
        signal_mode: signalMode,
        upper_quantile: upperQuantile,
        lower_quantile: lowerQuantile,
        transaction_cost: transactionCost,
        slippage: slippage,
      });
      setBacktestResult(res);
      setRiskReview(null);
      setReport(null);
      setActiveTab('Backtest');
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRisk = async () => {
    if (!backtestResult) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.evaluateRisk({
        metrics: backtestResult.metrics,
      });
      setRiskReview(res);
      setReport(null);
      setActiveTab('Risk');
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate risk');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMemo = async () => {
    if (!backtestResult || !riskReview) return;
    setLoading(true);
    setError(null);
    const mockVal = validation || {
      status: 'VALID',
      error: null,
      referenced_columns: ['close'],
      referenced_operators: [],
    };
    try {
      const res = await apiClient.generateReport({
        title: alphaIdea?.title || 'Time-Series Alpha Strategy',
        hypothesis: alphaIdea?.hypothesis || 'Quant research hypothesis based on formula operators',
        formula: alphaFormula,
        required_columns: ['close'],
        expected_behavior: alphaIdea?.expected_behavior || 'Quant trade execution thresholds',
        risk_notes: alphaIdea?.risk_notes || 'Synthetic backtesting limits',
        explanation: alphaIdea?.explanation || 'Formula execution via rolling sandbox',
        validation: mockVal as any,
        metrics: backtestResult.metrics,
        risk_decision: riskReview,
        backtest_config: {
          days, seed, scenario, formula: alphaFormula, signal_mode: signalMode,
          upper_quantile: upperQuantile, lower_quantile: lowerQuantile,
          transaction_cost: transactionCost, slippage,
        },
      });
      setReport(res);
      setActiveTab('Memo');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtifacts = async () => {
    if (!backtestResult || !riskReview || !report) return;
    setLoading(true);
    setError(null);
    const mockVal = validation || {
      status: 'VALID',
      error: null,
      referenced_columns: ['close'],
      referenced_operators: [],
    };
    try {
      const res = await apiClient.saveExperiment({
        title: alphaIdea?.title || 'Time-Series Alpha Strategy',
        hypothesis: alphaIdea?.hypothesis || 'Quant research hypothesis based on formula operators',
        formula: alphaFormula,
        required_columns: ['close'],
        expected_behavior: alphaIdea?.expected_behavior || 'Quant trade execution thresholds',
        risk_notes: alphaIdea?.risk_notes || 'Synthetic backtesting limits',
        explanation: alphaIdea?.explanation || 'Formula execution via rolling sandbox',
        validation: mockVal as any,
        metrics: backtestResult.metrics,
        risk_decision: riskReview,
        backtest_config: {
          days, seed, scenario, formula: alphaFormula, signal_mode: signalMode,
          upper_quantile: upperQuantile, lower_quantile: lowerQuantile,
          transaction_cost: transactionCost, slippage,
        },
      });
      addSavedArtifact(res);
      setActiveTab('Artifacts');
    } catch (err: any) {
      setError(err.message || 'Failed to save artifacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-toolbar">
      <div className="toolbar-group">
        <div className="toolbar-item">
          <label>Scenario</label>
          <select
            className="toolbar-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={loading}
          >
            <option value="random_walk">random_walk</option>
            <option value="trend_up">trend_up</option>
            <option value="trend_down">trend_down</option>
            <option value="mean_reverting">mean_reverting</option>
            <option value="volatile">volatile</option>
          </select>
        </div>

        <div className="toolbar-item">
          <label>Mode</label>
          <select
            className="toolbar-select"
            value={signalMode}
            onChange={(e) => setSignalMode(e.target.value)}
            disabled={loading}
          >
            <option value="long_short">long_short</option>
            <option value="long_flat">long_flat</option>
          </select>
        </div>

        <div className="toolbar-item">
          <label>Path</label>
          <input
            type="text"
            className="toolbar-input"
            style={{ width: '130px' }}
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="toolbar-item">
          <label>Formula</label>
          <span className="toolbar-formula-preview" title={alphaFormula}>
            {alphaFormula || 'None'}
          </span>
        </div>
      </div>

      <div className="toolbar-actions">
        <button
          className="toolbar-btn"
          onClick={handleGenerateData}
          disabled={loading}
        >
          {loading ? '...' : 'Gen Data'}
        </button>

        <button
          className="toolbar-btn"
          onClick={handleGenerateIdea}
          disabled={loading || !userPrompt.trim()}
        >
          Gen Idea
        </button>

        <button
          className="toolbar-btn"
          onClick={handleRunBacktest}
          disabled={loading || !dataGenerated}
        >
          Backtest
        </button>

        <button
          className="toolbar-btn"
          onClick={handleReviewRisk}
          disabled={loading || !backtestResult}
        >
          Risk Review
        </button>

        <button
          className="toolbar-btn"
          onClick={handleGenerateMemo}
          disabled={loading || !backtestResult || !riskReview}
        >
          Gen Memo
        </button>

        <button
          className="toolbar-btn primary-btn"
          onClick={handleSaveArtifacts}
          disabled={loading || !report}
        >
          Save
        </button>
      </div>
    </div>
  );
};
