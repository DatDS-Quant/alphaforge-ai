import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
import { Panel } from '../components/Panel';
import { MetricTile } from '../components/MetricTile';
import { EquityChart } from '../components/EquityChart';
import { DrawdownChart } from '../components/DrawdownChart';
import { SignalTable } from '../components/SignalTable';
import { WorkflowPrerequisites } from '../components/WorkflowPrerequisites';

export const BacktestAnalytics: React.FC = () => {
  const { dataGenerated, validation, backtestResult, alphaFormula, loading, setActiveTab } = useResearchStore();
  const { generateData, validateFormula, runBacktest } = useWorkflowActions();

  const formatPct = (val?: number) => `${((val || 0) * 100).toFixed(2)}%`;
  const formatNum = (val?: number) => (val || 0).toFixed(2);

  if (!dataGenerated) {
    return (
      <WorkflowPrerequisites
        title="Dataset Missing"
        description="A synthetic asset price path must be generated before the backtest can evaluate formula values."
        items={[
          { label: 'Data', status: 'Missing', ready: false },
          { label: 'Formula', status: alphaFormula.trim() ? 'Ready' : 'Missing', ready: !!alphaFormula.trim() },
        ]}
        primaryActionLabel="Generate Data"
        onPrimaryAction={generateData}
        secondaryActionLabel="Open Formula Lab"
        onSecondaryAction={() => setActiveTab('Formula Lab')}
        messageVariant="blocked"
      />
    );
  }

  if (!validation) {
    return (
      <WorkflowPrerequisites
        title="Formula Validation Missing"
        description="Validate the active formula before running a backtest."
        items={[
          { label: 'Data', status: 'Ready', ready: true },
          { label: 'Formula validation', status: 'Pending', ready: false },
        ]}
        primaryActionLabel="Validate Formula"
        onPrimaryAction={validateFormula}
        secondaryActionLabel="Open Formula Lab"
        onSecondaryAction={() => setActiveTab('Formula Lab')}
        messageVariant="warning"
      />
    );
  }

  if (!validation.is_valid) {
    return (
      <WorkflowPrerequisites
        title="Formula Invalid"
        description={validation.errors.join(' ') || 'The active formula failed validation.'}
        items={[
          { label: 'Data', status: 'Ready', ready: true },
          { label: 'Formula validation', status: 'Invalid', ready: false },
        ]}
        primaryActionLabel="Open Formula Lab"
        onPrimaryAction={() => setActiveTab('Formula Lab')}
        messageVariant="blocked"
      />
    );
  }

  if (!backtestResult) {
    return (
      <WorkflowPrerequisites
        title="Backtest Ready"
        description="Run the vectorized strategy simulation to produce metrics, curves, drawdown, and recent signals."
        items={[
          { label: 'Data', status: 'Ready', ready: true },
          { label: 'Formula validation', status: 'Valid', ready: true },
          { label: 'Backtest', status: 'Pending', ready: false },
        ]}
        primaryActionLabel={loading ? 'Running...' : 'Run Backtest'}
        onPrimaryAction={runBacktest}
        messageVariant="success"
      />
    );
  }

  const { metrics } = backtestResult;
  const zeroes = backtestResult.dates.map(() => 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div className="metric-tiles-grid">
        <MetricTile label="Total Return" value={formatPct(metrics.total_return)} />
        <MetricTile label="Sharpe Ratio" value={formatNum(metrics.sharpe)} />
        <MetricTile label="Max Drawdown" value={formatPct(metrics.max_drawdown)} />
        <MetricTile label="Win Rate" value={formatPct(metrics.win_rate)} />
        <MetricTile label="Profit Factor" value={formatNum(metrics.profit_factor)} />
        <MetricTile label="Turnover" value={formatPct(metrics.turnover)} />
        <MetricTile label="Trades" value={metrics.number_of_trades} />
        <MetricTile label="Exposure" value={formatNum(metrics.exposure_ratio)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <Panel title="Strategy Equity Curve" action={<button onClick={runBacktest} disabled={loading} style={{ height: '22px', padding: '0 0.5rem', fontSize: '10px' }}>{loading ? 'Running...' : 'Run Backtest'}</button>}>
            <EquityChart dates={backtestResult.dates} strategyCurve={backtestResult.equity_curve} height={260} />
          </Panel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Panel title="Drawdown Curve"><DrawdownChart dates={backtestResult.dates} drawdownCurve={backtestResult.drawdown} height={160} /></Panel>
            <Panel title="Benchmark Metrics">
              <div className="stat-list">
                <div><span>Buy & Hold Return</span><strong>{formatPct(metrics.buy_hold_total_return)}</strong></div>
                <div><span>Excess Return</span><strong>{formatPct(metrics.strategy_excess_return_vs_buy_hold)}</strong></div>
                <div><span>Asset Correlation</span><strong>{formatNum(metrics.strategy_correlation_to_asset_return)}</strong></div>
              </div>
            </Panel>
          </div>
        </div>
        <Panel title="Recent Signals" style={{ height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SignalTable dates={backtestResult.dates} prices={zeroes} signals={backtestResult.signals} strategyReturns={backtestResult.trades} equityCurve={backtestResult.equity_curve} limit={25} />
          </div>
        </Panel>
      </div>
    </div>
  );
};