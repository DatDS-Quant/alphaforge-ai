import React, { useState } from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';

export const ResearchMemo: React.FC = () => {
  const {
    days, seed, scenario, alphaFormula, signalMode, upperQuantile, lowerQuantile, transactionCost, slippage,
    alphaIdea, validation, backtestResult, riskReview,
    report, setReport,
    savedArtifact, addSavedArtifact,
    loading, setLoading,
    setError,
  } = useResearchStore();

  const [memoOpen, setMemoOpen] = useState(true);

  const handleGenerateReport = async () => {
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
    } catch (err: any) {
      setError(err.message || 'Failed to save artifacts');
    } finally {
      setLoading(false);
    }
  };

  const getSizingActionText = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'REJECT') {
      return 'Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests.';
    }
    if (d === 'REDUCE') {
      return 'Use reduced sizing only under simplified assumptions and run robustness tests.';
    }
    return 'Approved only under simplified synthetic and vectorized assumptions. Validate further before any real-world use.';
  };

  if (!backtestResult || !riskReview) {
    return (
      <EmptyState
        title="Research Memo Blocked"
        description="A backtest simulation and compliance review must be performed first to generate a research memo."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {!report ? (
        <EmptyState
          title="Research Memo Pending"
          description="Click below to compile validation analysis, vectorized returns, and sizing compliance decisions."
          actionLabel="Compile Research Memo"
          onAction={handleGenerateReport}
        />
      ) : (
        <>
          {/* Research Verdict Card */}
          <Panel title="Research Verdict spec">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="metric-tile">
                <span className="metric-tile-label">Decision Verdict</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <strong style={{ fontSize: '13px' }}>{riskReview.decision}</strong>
                  <RiskBadge decision={riskReview.decision} />
                </div>
              </div>

              <div className="metric-tile">
                <span className="metric-tile-label">Suggested Sizing Action</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {getSizingActionText(riskReview.decision)}
                </span>
              </div>

              <div className="metric-tile">
                <span className="metric-tile-label">Key Performance Metrics</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '0.15rem' }}>
                  Return: {(backtestResult.metrics.total_return * 100).toFixed(1)}% | Sharpe: {backtestResult.metrics.sharpe.toFixed(2)} | Max DD: {(backtestResult.metrics.max_drawdown * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Panel>

          {/* Full Memo Scroll Panel */}
          <Panel
            title="Full Research Memo Document"
            action={
              <button
                className="toolbar-btn"
                onClick={() => setMemoOpen(!memoOpen)}
                style={{ height: '18px', padding: '0 0.4rem', fontSize: '9px' }}
              >
                {memoOpen ? 'Collapse' : 'Expand'}
              </button>
            }
          >
            {memoOpen && (
              <div style={{ flex: 1, backgroundColor: '#03050a', border: '1px solid var(--border)', padding: '0.75rem', overflowY: 'auto', maxHeight: '280px' }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                }}>
                  {report.report_markdown}
                </pre>
              </div>
            )}
          </Panel>

          {/* Disk Serialization Actions */}
          <Panel title="Disk Artifacts Serialization">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '11px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Serialize experiment details, metadata configurations, returns curves, and markdown memo directly to reports folder.
              </p>
              <div>
                <button
                  onClick={handleSaveArtifacts}
                  disabled={loading}
                  style={{ height: '26px', fontSize: '11px' }}
                >
                  {loading ? 'Serializing...' : 'Save Experiment Artifacts'}
                </button>
              </div>

              {savedArtifact && (
                <div style={{
                  border: '1px solid rgba(0, 173, 181, 0.2)',
                  backgroundColor: 'rgba(0, 173, 181, 0.02)',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  fontSize: '10px',
                }}>
                  <strong style={{ color: 'var(--accent-teal)' }}>✓ Serialization complete:</strong>
                  <div><strong>ID:</strong> <code style={{ color: 'var(--accent-gold)' }}>{savedArtifact.experiment_id}</code></div>
                  <div><strong>Report Path:</strong> <code>{savedArtifact.report_path}</code></div>
                  <div><strong>Metadata Path:</strong> <code>{savedArtifact.metadata_path}</code></div>
                </div>
              )}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
};
