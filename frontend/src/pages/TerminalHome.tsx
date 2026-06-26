import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { MetricTile } from '../components/MetricTile';
import { RiskBadge } from '../components/RiskBadge';

export const TerminalHome: React.FC = () => {
  const {
    dataGenerated, setDataGenerated,
    alphaIdea,
    validation,
    backtestResult, setBacktestResult,
    riskReview, setRiskReview,
    report, setReport,
    savedArtifact,
    scenario,
    days,
    seed,
    alphaFormula,
    setActiveTab,
    dataPath, signalMode, upperQuantile, lowerQuantile, transactionCost, slippage,
    loading, setLoading,
    setError, resetAll
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

  const handleRunBacktest = async () => {
    if (!dataGenerated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.runBacktest({
        formula: alphaFormula,
        data_path: dataPath,
        mode: signalMode,
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

  const getSystemStatus = () => {
    if (!dataGenerated) return 'Awaiting Dataset Initialization';
    if (!alphaFormula) return 'Dataset Initialized - Ready for Alpha Generation';
    if (!backtestResult) return 'Alpha Expression Defined - Ready for Historical Backtest';
    if (!riskReview) return 'Backtest Finished - Ready for Compliance Audit';
    return 'Research Memo Ready - Awaiting Experiment Serialization';
  };

  const getSizingAction = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'REJECT') {
      return 'Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests.';
    }
    if (d === 'REDUCE') {
      return 'Use reduced sizing only under simplified assumptions and run robustness tests.';
    }
    return 'Approved only under simplified research assumptions. Validate further before any real-world use.';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="term-alert info">
        <strong>Terminal Scope Disclaimer:</strong>
        <span> Single-asset synthetic research environment. Not live trading. All prices and scenarios are simulated.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Main Status Panel */}
        <Panel title="Research Pipeline status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>Active Stage</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '0.15rem' }}>
                {getSystemStatus()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Generated Data Path:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                  {dataPath}
                </p>
              </div>
              <div>
                <strong>Scenario Mode:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                  {scenario} ({days} days, seed {seed})
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Configuration Summary */}
        <Panel title="Active Alpha Reference">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px' }}>
            <div>
              <strong>Mathematical Expression:</strong>
              <pre style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: '0.4rem',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-gold)',
                whiteSpace: 'pre-wrap',
                marginTop: '0.25rem',
                fontSize: '11px'
              }}>
                {alphaFormula || 'None'}
              </pre>
            </div>
          </div>
        </Panel>
      </div>

      {/* Reusable Pipeline Status Table */}
      <Panel title="Quantitative Research Pipeline Status">
        <div className="terminal-table-container">
          <table className="terminal-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Step</th>
                <th>Process Area</th>
                <th>Current Status</th>
                <th>Requirement / State</th>
                <th style={{ textAlign: 'right' }}>Direct Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Generate Data</td>
                <td>
                  <span className={`term-badge ${dataGenerated ? 'teal' : 'red'}`}>
                    {dataGenerated ? 'Ready' : 'Missing'}
                  </span>
                </td>
                <td>{dataGenerated ? `${days} candles generated` : 'Requires synthetic data path generation'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={handleGenerateData}
                    disabled={loading}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    {loading ? '...' : 'Generate Data'}
                  </button>
                </td>
              </tr>
              <tr>
                <td>2</td>
                <td>Alpha Generation</td>
                <td>
                  <span className={`term-badge ${alphaIdea || alphaFormula ? 'teal' : 'amber'}`}>
                    {alphaIdea ? 'Ready (AI)' : alphaFormula ? 'Ready (Manual)' : 'Pending'}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {alphaFormula ? (alphaFormula.length > 50 ? alphaFormula.slice(0, 47) + '...' : alphaFormula) : 'No active formula configured'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('Research Desk')}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Go to Research Desk
                  </button>
                </td>
              </tr>
              <tr>
                <td>3</td>
                <td>Formula Validation</td>
                <td>
                  <span className={`term-badge ${validation ? (validation.is_valid ? 'teal' : 'red') : 'blue'}`}>
                    {validation ? (validation.is_valid ? 'VALID' : 'INVALID') : 'Pending'}
                  </span>
                </td>
                <td>{validation ? (validation.is_valid ? 'AST Validated' : 'Validation Errors present') : 'Verify AST sandbox constraints'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('Formula Lab')}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Go to Formula Lab
                  </button>
                </td>
              </tr>
              <tr>
                <td>4</td>
                <td>Vectorized Backtest</td>
                <td>
                  <span className={`term-badge ${backtestResult ? 'teal' : 'blue'}`}>
                    {backtestResult ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td>{backtestResult ? `${backtestResult.metrics.number_of_trades} trades simulated` : 'Evaluate return against baseline benchmark'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={handleRunBacktest}
                    disabled={loading || !dataGenerated || !alphaFormula}
                    className="toolbar-btn primary-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Run Backtest
                  </button>
                </td>
              </tr>
              <tr>
                <td>5</td>
                <td>Risk Review Compliance</td>
                <td>
                  <span className={`term-badge ${riskReview ? (riskReview.decision === 'REJECT' ? 'red' : riskReview.decision === 'REDUCE' ? 'amber' : 'teal') : 'blue'}`}>
                    {riskReview ? riskReview.decision : 'Pending'}
                  </span>
                </td>
                <td>{riskReview ? `Recommended Sizing Scale: ${(riskReview.recommended_scale * 100).toFixed(0)}%` : 'Verify drawdown and turnover rules'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('Risk')}
                    disabled={!backtestResult}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Go to Risk
                  </button>
                </td>
              </tr>
              <tr>
                <td>6</td>
                <td>Research Report Memo</td>
                <td>
                  <span className={`term-badge ${report ? 'teal' : 'blue'}`}>
                    {report ? 'Generated' : 'Pending'}
                  </span>
                </td>
                <td>{report ? 'Markdown research memo is ready' : 'Compile quantitative verdict analysis'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('Memo')}
                    disabled={!backtestResult || !riskReview}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Go to Memo
                  </button>
                </td>
              </tr>
              <tr>
                <td>7</td>
                <td>Save Artifacts</td>
                <td>
                  <span className={`term-badge ${savedArtifact ? 'teal' : 'blue'}`}>
                    {savedArtifact ? 'Saved' : 'Not Saved'}
                  </span>
                </td>
                <td>{savedArtifact ? `Saved under ID: ${savedArtifact.experiment_id.slice(0, 8)}...` : 'Serialize report and metadata configurations locally'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('Artifacts')}
                    disabled={!savedArtifact}
                    className="toolbar-btn"
                    style={{ fontSize: '10px', height: '20px', padding: '0 0.5rem', display: 'inline-flex', marginLeft: 'auto' }}
                  >
                    Go to Artifacts
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Compliance Panel */}
        <Panel title="Latest Sizing Compliance Review">
          {riskReview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <strong>Decision Sizing:</strong>
                <RiskBadge decision={riskReview.decision} />
              </div>
              <div>
                <strong>Recommended Scale:</strong>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  {(riskReview.recommended_scale * 100).toFixed(0)}%
                </span>
              </div>
              <div className="term-alert info" style={{ borderLeftColor: riskReview.decision === 'REJECT' ? 'var(--risk-red)' : riskReview.decision === 'REDUCE' ? 'var(--warning-amber)' : 'var(--accent-teal)' }}>
                <strong>Risk Action:</strong> {getSizingAction(riskReview.decision)}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '1rem' }}>
              Awaiting risk review compliance check.
            </div>
          )}
        </Panel>

        {/* Quick Metrics Panel */}
        <Panel title="Simulation Results Overview">
          {backtestResult ? (
            <div className="metric-tiles-grid" style={{ padding: '0.25rem 0' }}>
              <MetricTile
                label="Total Return"
                value={`${(backtestResult.metrics.total_return * 100).toFixed(2)}%`}
              />
              <MetricTile
                label="Sharpe"
                value={backtestResult.metrics.sharpe.toFixed(2)}
              />
              <MetricTile
                label="Max Drawdown"
                value={`${(backtestResult.metrics.max_drawdown * 100).toFixed(2)}%`}
              />
              <MetricTile
                label="Trades Count"
                value={backtestResult.metrics.number_of_trades}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '1rem' }}>
              No strategy metrics calculated. Run a backtest simulation to populate.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};