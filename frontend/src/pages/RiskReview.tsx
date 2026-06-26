import React from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { StatusPill } from '../components/StatusPill';
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
      const { apiClient } = await import('../api/client');
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

  const getSizingStyle = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'APPROVE') return { color: 'var(--color-approve)', borderLeft: '4px solid var(--color-approve)' };
    if (d === 'REDUCE') return { color: 'var(--color-reduce)', borderLeft: '4px solid var(--color-reduce)' };
    return { color: 'var(--color-reject)', borderLeft: '4px solid var(--color-reject)' };
  };

  const getAlertBannerType = (decision: string) => {
    const d = decision.toUpperCase();
    if (d === 'APPROVE') return 'alert-banner success';
    if (d === 'REDUCE') return 'alert-banner warning';
    return 'alert-banner error';
  };

  if (!backtestResult) {
    return (
      <EmptyState
        title="Risk Review Blocked"
        description="Please run a strategy backtest first in order to review quantitative metrics compliance."
      />
    );
  }

  if (!riskReview) {
    return (
      <EmptyState
        title="Risk Review Pending"
        description="Review strategy guidelines, drawdown levels, and trade frequency constraints."
        actionLabel="Perform Risk Compliance Review"
        onAction={handleReviewRisk}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">Risk Review Desk</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px' }}>
          Evaluate strategy performance against strict quantitative limits. Rules assess drawdown, trading frequency, Sharpe performance, and position turnover.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{
            ...getSizingStyle(riskReview.decision),
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            padding: '1.25rem',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            borderLeftWidth: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Compliance Status Decision</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{riskReview.decision}</span>
                <StatusPill status={riskReview.decision} />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Position Sizing Scale</span>
              <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                {(riskReview.recommended_scale * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '12px' }}>
            <h4 style={{ fontWeight: 600, fontSize: '12px' }}>Rule Violation Findings</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="metric-card">
                <span className="metric-card-label">Drawdown Check</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '0.25rem' }}>
                  {riskReview.rule_findings.max_drawdown}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Trade Frequency</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '0.25rem' }}>
                  {riskReview.rule_findings.number_of_trades}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Sharpe Performance</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '0.25rem' }}>
                  {riskReview.rule_findings.sharpe}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-card-label">Turnover Check</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', marginTop: '0.25rem' }}>
                  {riskReview.rule_findings.turnover}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {riskReview.reasons.length > 0 && (
        <div className="card">
          <h3 className="card-title">Compliance Evaluation Details</h3>
          <ul style={{ margin: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '12px' }}>
            {riskReview.reasons.map((reason, idx) => (
              <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={getAlertBannerType(riskReview.decision)}>
        <strong>Suggested Sizing Action Guidelines</strong>
        <span style={{ fontSize: '12px', marginTop: '0.25rem' }}>
          {riskReview.decision === 'REJECT' && (
            <span>Do not promote this strategy. Investigate risk drivers, reduce turnover, and run robustness tests.</span>
          )}
          {riskReview.decision === 'REDUCE' && (
            <span>Use reduced sizing only under simplified assumptions and run robustness tests.</span>
          )}
          {riskReview.decision === 'APPROVE' && (
            <span>Approved only under simplified synthetic and vectorized assumptions. Validate further before any real-world use.</span>
          )}
        </span>
      </div>
    </div>
  );
};
