import React, { useState } from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';

export const ResearchReport: React.FC = () => {
  const {
    days, seed, scenario, alphaFormula, signalMode, upperQuantile, lowerQuantile, transactionCost, slippage,
    alphaIdea, validation, backtestResult, riskReview,
    report, setReport,
    savedArtifact, addSavedArtifact,
    loading, setLoading,
    setError,
  } = useResearchStore();

  const [memoOpen, setMemoOpen] = useState(true);

  // Trigger: Generate report
  const handleGenerateReport = async () => {
    if (!backtestResult || !riskReview) return;
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
      const { apiClient } = await import('../api/client');
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
      const { apiClient } = await import('../api/client');
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
    } catch (err: any) {
      setError(err.message || 'Failed to save experiment artifacts');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedAction = (decision: string) => {
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
        description="Please complete strategy backtesting and risk review calculations first before generating a research memo."
      />
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Research Memo Pending"
        description="Compile validation outputs, backtest metrics, and compliance verdicts into a single research paper."
        actionLabel="Compile Research Memo"
        onAction={handleGenerateReport}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">Research Verdict Summary</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          fontSize: '12px',
          marginBottom: '1rem',
        }}>
          <div className="metric-card">
            <span className="metric-card-label">Verdict Decision</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <strong style={{ fontSize: '15px' }}>{riskReview.decision}</strong>
              <StatusPill status={riskReview.decision} />
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-card-label">Primary Reason</span>
            <span style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
              {riskReview.reasons[0] || 'No compliance issues found'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-card-label">Key Performance Metrics</span>
            <span style={{ fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
              Return: {(backtestResult.metrics.total_return * 100).toFixed(1)}% | Sharpe: {backtestResult.metrics.sharpe.toFixed(2)} | Max DD: {(backtestResult.metrics.max_drawdown * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="alert-banner info" style={{ fontSize: '12px' }}>
          <strong>Suggested Action:</strong>
          <span>{getSuggestedAction(riskReview.decision)}</span>
        </div>
      </div>

      <div className="expander">
        <div className="expander-header" onClick={() => setMemoOpen(!memoOpen)}>
          <span>Full Research Memo</span>
          <span>{memoOpen ? '[-]' : '[+]'}</span>
        </div>
        {memoOpen && (
          <div className="expander-content" style={{ backgroundColor: '#05070c' }}>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              padding: '0.5rem',
            }}>
              {report.report_markdown}
            </pre>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Artifact Serialization Actions</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '12px' }}>
          Save the complete experiment metadata, configurations, and generated Markdown memo directly to the local filesystem.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <button onClick={handleSaveArtifacts} disabled={loading}>
              {loading ? 'Serializing...' : 'Save Experiment Artifacts'}
            </button>
          </div>

          {savedArtifact && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '11px',
              backgroundColor: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--border-radius)',
              padding: '0.75rem',
            }}>
              <span style={{ color: 'var(--color-approve)', fontWeight: 'bold' }}>✓ Experiment serialized successfully!</span>
              <div><strong>Experiment ID:</strong> <code style={{ color: 'var(--text-secondary)' }}>{savedArtifact.experiment_id}</code></div>
              <div><strong>Markdown Report Path:</strong> <code style={{ color: 'var(--text-secondary)' }}>{savedArtifact.report_path}</code></div>
              <div><strong>Metadata JSON Path:</strong> <code style={{ color: 'var(--text-secondary)' }}>{savedArtifact.metadata_path}</code></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
