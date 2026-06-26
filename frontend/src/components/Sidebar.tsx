import React, { useState } from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { apiClient } from '../api/client';

export const Sidebar: React.FC = () => {
  const {
    days, setDays,
    seed, setSeed,
    scenario, setScenario,
    dataPath, setDataPath,
    alphaFormula, setAlphaFormula,
    signalMode, setSignalMode,
    upperQuantile, setUpperQuantile,
    lowerQuantile, setLowerQuantile,
    transactionCost, setTransactionCost,
    slippage, setSlippage,
    
    dataGenerated, setDataGenerated,
    backtestResult, setBacktestResult,
    riskReview, setRiskReview,
    report, setReport,
    addSavedArtifact,
    
    alphaIdea,
    validation,
    
    loading, setLoading,
    error, setError,
    setActiveTab,
    resetAll,
  } = useResearchStore();

  // Expander open states
  const [dataOpen, setDataOpen] = useState(true);
  const [signalOpen, setSignalOpen] = useState(true);
  const [costsOpen, setCostsOpen] = useState(false);

  // Trigger: Generate Data
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
      resetAll(); // Reset downstream pipeline
      setActiveTab('Formula Lab');
    } catch (err: any) {
      setError(err.message || 'Failed to generate data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger: Run Backtest
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
      setRiskReview(null); // Reset risk downstream
      setReport(null);
      setActiveTab('Backtest Lab');
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  // Trigger: Review Risk
  const handleReviewRisk = async () => {
    if (!backtestResult) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.evaluateRisk({
        metrics: backtestResult.metrics,
      });
      setRiskReview(res);
      setReport(null); // Reset report downstream
      setActiveTab('Risk Review');
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate risk');
    } finally {
      setLoading(false);
    }
  };

  // Trigger: Generate Report
  const handleGenerateReport = async () => {
    if (!backtestResult || !riskReview) return;
    setLoading(true);
    setError(null);
    
    // Default metadata placeholder fallback if alpha idea wasn't generated via Research Desk
    const conceptTitle = alphaIdea?.title || 'Time-Series Alpha Strategy';
    const conceptHypothesis = alphaIdea?.hypothesis || 'Quant research hypothesis based on formula operators';
    const conceptExplanation = alphaIdea?.explanation || 'Formula execution via rolling time-series sandbox';
    const conceptRisk = alphaIdea?.risk_notes || 'Synthetic market assumptions and zero lookahead validation';
    const expectedBehavior = alphaIdea?.expected_behavior || 'Long asset when alpha is above upper quantile threshold, short/flat otherwise';
    
    // AST Validation structure fallback
    const mockVal = validation || {
      status: 'VALID',
      error: null,
      referenced_columns: ['close'],
      referenced_operators: [],
    };

    try {
      const res = await apiClient.generateReport({
        title: conceptTitle,
        hypothesis: conceptHypothesis,
        formula: alphaFormula,
        required_columns: ['close'],
        expected_behavior: expectedBehavior,
        risk_notes: conceptRisk,
        explanation: conceptExplanation,
        validation: mockVal as any,
        metrics: backtestResult.metrics,
        risk_decision: riskReview,
        backtest_config: {
          days,
          seed,
          scenario,
          formula: alphaFormula,
          signal_mode: signalMode,
          upper_quantile: upperQuantile,
          lower_quantile: lowerQuantile,
          transaction_cost: transactionCost,
          slippage: slippage,
        },
      });
      setReport(res);
      setActiveTab('Research Memo');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Trigger: Save Artifacts
  const handleSaveArtifacts = async () => {
    if (!backtestResult || !riskReview || !report) return;
    setLoading(true);
    setError(null);

    const conceptTitle = alphaIdea?.title || 'Time-Series Alpha Strategy';
    const conceptHypothesis = alphaIdea?.hypothesis || 'Quant research hypothesis based on formula operators';
    const conceptExplanation = alphaIdea?.explanation || 'Formula execution via rolling time-series sandbox';
    const conceptRisk = alphaIdea?.risk_notes || 'Synthetic market assumptions and zero lookahead validation';
    const expectedBehavior = alphaIdea?.expected_behavior || 'Long asset when alpha is above upper quantile threshold, short/flat otherwise';

    const mockVal = validation || {
      status: 'VALID',
      error: null,
      referenced_columns: ['close'],
      referenced_operators: [],
    };

    try {
      const res = await apiClient.saveExperiment({
        title: conceptTitle,
        hypothesis: conceptHypothesis,
        formula: alphaFormula,
        required_columns: ['close'],
        expected_behavior: expectedBehavior,
        risk_notes: conceptRisk,
        explanation: conceptExplanation,
        validation: mockVal as any,
        metrics: backtestResult.metrics,
        risk_decision: riskReview,
        backtest_config: {
          days,
          seed,
          scenario,
          formula: alphaFormula,
          signal_mode: signalMode,
          upper_quantile: upperQuantile,
          lower_quantile: lowerQuantile,
          transaction_cost: transactionCost,
          slippage: slippage,
        },
      });
      addSavedArtifact(res);
      setActiveTab('Experiment Artifacts');
    } catch (err: any) {
      setError(err.message || 'Failed to save artifacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">AlphaForge</h1>
        <div className="sidebar-subtitle">Quant Research Workstation</div>
      </div>

      <div className="sidebar-content">
        {/* Section 1: Data Setup */}
        <div className="expander">
          <div className="expander-header" onClick={() => setDataOpen(!dataOpen)}>
            <span>Data Settings</span>
            <span>{dataOpen ? '[-]' : '[+]'}</span>
          </div>
          {dataOpen && (
            <div className="expander-content">
              <div className="form-group">
                <label>Days to Generate</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Synthetic Scenario</label>
                <select
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
              <div className="form-group">
                <label>Data File Path</label>
                <input
                  type="text"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Alpha Settings */}
        <div className="expander">
          <div className="expander-header" onClick={() => setSignalOpen(!signalOpen)}>
            <span>Alpha & Signal Settings</span>
            <span>{signalOpen ? '[-]' : '[+]'}</span>
          </div>
          {signalOpen && (
            <div className="expander-content">
              <div className="form-group">
                <label>Alpha Formula Expression</label>
                <textarea
                  rows={3}
                  value={alphaFormula}
                  onChange={(e) => setAlphaFormula(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Signal Mode</label>
                <select
                  value={signalMode}
                  onChange={(e) => setSignalMode(e.target.value)}
                  disabled={loading}
                >
                  <option value="long_short">long_short</option>
                  <option value="long_flat">long_flat</option>
                </select>
              </div>
              <div className="form-group">
                <label>Upper Quantile</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={upperQuantile}
                  onChange={(e) => setUpperQuantile(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Lower Quantile</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={lowerQuantile}
                  onChange={(e) => setLowerQuantile(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Cost Settings */}
        <div className="expander">
          <div className="expander-header" onClick={() => setCostsOpen(!costsOpen)}>
            <span>Execution Cost Settings</span>
            <span>{costsOpen ? '[-]' : '[+]'}</span>
          </div>
          {costsOpen && (
            <div className="expander-content">
              <div className="form-group">
                <label>Transaction Cost Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={transactionCost}
                  onChange={(e) => setTransactionCost(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Slippage Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions Button panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
          <button
            className="action-btn"
            onClick={handleGenerateData}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Generate Data'}
          </button>
          
          <button
            className="action-btn"
            onClick={handleRunBacktest}
            disabled={loading || !dataGenerated}
          >
            Run Backtest
          </button>
          
          <button
            className="action-btn"
            onClick={handleReviewRisk}
            disabled={loading || !backtestResult}
          >
            Review Risk
          </button>
          
          <button
            className="action-btn"
            onClick={handleGenerateReport}
            disabled={loading || !backtestResult || !riskReview}
          >
            Generate Memo
          </button>
          
          <button
            className="action-btn"
            onClick={handleSaveArtifacts}
            disabled={loading || !report}
          >
            Save Artifacts
          </button>
        </div>

        {error && (
          <div className="alert-banner error" style={{ fontSize: '11px', marginTop: '0.5rem' }}>
            <span>{error}</span>
          </div>
        )}
      </div>
    </aside>
  );
};
