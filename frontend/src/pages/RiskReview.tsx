import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';
import { EmptyState } from '../components/EmptyState';

export const RiskReview: React.FC = () => {
  const {
    backtestResult,
    riskReview, setRiskReview,
    setLoading,
    setError,
  } = useResearchStore();

  const handleReviewRisk = async () => {
    if (!backtestResult) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.evaluateRisk({
        metrics: backtestResult.metrics,
      });
      setRiskReview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to review risk');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionBorder = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'APPROVE') return 'var(--accent-teal)';
    if (d === 'REDUCE') return 'var(--warning-amber)';
    return 'var(--risk-red)';
  };

  const getSuggestedActionText = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'REJECT') {
      return 'Rejected by risk rules. Do not promote this strategy without further research.';
    }
    if (d === 'REDUCE') {
      return 'Reduced sizing recommended under simplified assumptions.';
    }
    return 'Approved only under simplified research assumptions.';
  };

  if (!backtestResult) {
    return (
      <EmptyState
        title="Risk Review Blocked"
        description="Run a vectorized backtest strategy simulation first to check compliance limits."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {!riskReview ? (
        <EmptyState
          title="Risk Evaluation Pending"
          description="Evaluate strategy drawdowns, transaction frequencies, and turnover rules."
          actionLabel="Perform Risk Compliance Audit"
          onAction={handleReviewRisk}
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Committee Verdict */}
            <Panel title="Risk Committee Verdict">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '0.5rem 0',
                borderLeft: `4px solid ${getDecisionBorder(riskReview.decision)}`,
                paddingLeft: '1rem',
              }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sizing Decision</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{riskReview.decision}</span>
                    <RiskBadge decision={riskReview.decision} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Sizing Factor</span>
                  <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                    {(riskReview.recommended_scale * 100).toFixed(0)}%
                  </div>
                </div>

                <div className={`term-alert ${riskReview.decision.toLowerCase() === 'reject' ? 'error' : riskReview.decision.toLowerCase() === 'reduce' ? 'warning' : 'success'}`} style={{ marginTop: '0.5rem' }}>
                  <strong>Compliance Sizing Action:</strong>
                  <p style={{ marginTop: '0.2rem' }}>{getSuggestedActionText(riskReview.decision)}</p>
                </div>
              </div>
            </Panel>

            {/* Sizing compliance checks */}
            <Panel title="Compliance Checklist Rule Findings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.25rem 0' }}>
                <div className="metric-tile">
                  <span className="metric-tile-label">Max Drawdown Check</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '0.15rem' }}>
                    {riskReview.rule_findings.max_drawdown}
                  </span>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-label">Trade Frequency Check</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '0.15rem' }}>
                    {riskReview.rule_findings.number_of_trades}
                  </span>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-label">Sharpe Ratio Check</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '0.15rem' }}>
                    {riskReview.rule_findings.sharpe}
                  </span>
                </div>
                <div className="metric-tile">
                  <span className="metric-tile-label">Turnover Check</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginTop: '0.15rem' }}>
                    {riskReview.rule_findings.turnover}
                  </span>
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Sizing Details */}
            <Panel title="Compliance Evaluation Rationale">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px' }}>
                <strong>Audit Reasons Log:</strong>
                {riskReview.reasons.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No compliance rule violations triggered.</p>
                ) : (
                  <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {riskReview.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>

            {/* Threshold limits */}
            <Panel title="System Risk Compliance Thresholds">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px', padding: '0.25rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Max Drawdown Limit:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>&lt; -25.0%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Trades Requirement:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>&gt;= 5 trades</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Max Turnover Limit:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>&lt; 60.0%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Min Sharpe Benchmark:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>&gt;= 1.00</span>
                </div>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
};
