import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';
import { WorkflowPrerequisites } from '../components/WorkflowPrerequisites';

export const RiskReview: React.FC = () => {
  const { backtestResult, riskReview, loading, setActiveTab } = useResearchStore();
  const { reviewRisk } = useWorkflowActions();

  const getDecisionBorder = (decision: string) => {
    if (decision === 'APPROVE') return 'var(--accent-teal)';
    if (decision === 'REDUCE') return 'var(--warning-amber)';
    return 'var(--risk-red)';
  };

  if (!backtestResult) {
    return (
      <WorkflowPrerequisites
        title="Risk Review Needs Backtest"
        description="Run a backtest first so risk rules can evaluate drawdown, turnover, trades, and Sharpe."
        items={[{ label: 'Backtest', status: 'Missing', ready: false }]}
        primaryActionLabel="Go to Backtest"
        onPrimaryAction={() => setActiveTab('Backtest')}
        messageVariant="blocked"
      />
    );
  }

  if (!riskReview) {
    return (
      <WorkflowPrerequisites
        title="Risk Review Ready"
        description="Review risk after a completed backtest. REJECT is still a valid research outcome."
        items={[
          { label: 'Backtest', status: 'Completed', ready: true },
          { label: 'Risk decision', status: 'Pending', ready: false },
        ]}
        primaryActionLabel={loading ? 'Reviewing...' : 'Review Risk'}
        onPrimaryAction={reviewRisk}
        messageVariant="success"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Panel title="Risk Decision" action={<button onClick={reviewRisk} disabled={loading} style={{ height: '22px', padding: '0 0.5rem', fontSize: '10px' }}>{loading ? 'Reviewing...' : 'Review Risk'}</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${getDecisionBorder(riskReview.decision)}`, paddingLeft: '1rem' }}>
            <div><span className="metric-tile-label">Decision</span><div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.2rem' }}><strong style={{ fontSize: '18px' }}>{riskReview.decision}</strong><RiskBadge decision={riskReview.decision} /></div></div>
            <div><span className="metric-tile-label">Recommended Scale</span><div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{(riskReview.recommended_scale * 100).toFixed(0)}%</div></div>
            <div className={`term-alert ${riskReview.decision === 'REJECT' ? 'error' : riskReview.decision === 'REDUCE' ? 'warning' : 'success'}`}>{riskReview.disclaimer}</div>
          </div>
        </Panel>
        <Panel title="Rule Findings">
          <div className="metric-tiles-grid">
            <div className="metric-tile"><span className="metric-tile-label">Max Drawdown</span><strong>{riskReview.rule_findings.max_drawdown}</strong></div>
            <div className="metric-tile"><span className="metric-tile-label">Trades</span><strong>{riskReview.rule_findings.number_of_trades}</strong></div>
            <div className="metric-tile"><span className="metric-tile-label">Sharpe</span><strong>{riskReview.rule_findings.sharpe}</strong></div>
            <div className="metric-tile"><span className="metric-tile-label">Turnover</span><strong>{riskReview.rule_findings.turnover}</strong></div>
          </div>
        </Panel>
      </div>
      <Panel title="Risk Rationale">
        {riskReview.reasons.length ? <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)' }}>{riskReview.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : <p style={{ color: 'var(--text-secondary)' }}>No rule violations triggered.</p>}
      </Panel>
    </div>
  );
};