import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { Panel } from '../components/Panel';
import { MetricTile } from '../components/MetricTile';
import { RiskBadge } from '../components/RiskBadge';

export const TerminalHome: React.FC = () => {
  const {
    dataGenerated,
    alphaIdea,
    backtestResult,
    riskReview,
    scenario,
    days,
    seed,
    alphaFormula,
    setActiveTab,
  } = useResearchStore();

  const getSystemStatus = () => {
    if (!dataGenerated) return 'Awaiting Dataset Initialization';
    if (!alphaIdea) return 'Dataset Initialized - Ready for Alpha Generation';
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
    return 'Approved only under simplified synthetic and vectorized assumptions. Validate further before any real-world use.';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="term-alert info">
        <strong>Terminal Scope Disclaimer:</strong>
        <span> Single-asset synthetic research environment. Not live trading. All prices and scenarios are simulated.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Main Status Panel */}
        <Panel title="Research Pipeline Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>Active Stage</span>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-gold)', marginTop: '0.15rem' }}>
                {getSystemStatus()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Generated Data:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {dataGenerated ? `Ready (${days} days, seed ${seed})` : 'None'}
                </p>
              </div>
              <div>
                <strong>Scenario Mode:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                  {scenario}
                </p>
              </div>
            </div>

            {!dataGenerated && (
              <div style={{
                border: '1px dashed var(--border)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius)',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                marginTop: '0.5rem',
              }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Start by generating synthetic data and an alpha research idea.
                </p>
                <button
                  onClick={() => setActiveTab('Research Desk')}
                  style={{
                    backgroundColor: 'var(--accent-teal)',
                    color: 'var(--bg-base)',
                    fontSize: '11px',
                    height: '24px',
                    padding: '0 0.75rem',
                  }}
                >
                  Go to Research Desk
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Configuration Summary */}
        <Panel title="Active Alpha Reference">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '11px' }}>
            <div>
              <strong>Mathematical Expression:</strong>
              <pre style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: '0.5rem',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-gold)',
                whiteSpace: 'pre-wrap',
                marginTop: '0.25rem',
              }}>
                {alphaFormula || 'None'}
              </pre>
            </div>

            <div>
              <strong>Hypothesis Description:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                {alphaIdea?.hypothesis || 'No active hypothesis generated yet. Use the Research Desk tab to configure one.'}
              </p>
            </div>
          </div>
        </Panel>
      </div>

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
