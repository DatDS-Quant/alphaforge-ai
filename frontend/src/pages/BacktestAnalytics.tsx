import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { MetricTile } from '../components/MetricTile';
import { EquityChart } from '../components/EquityChart';
import { DrawdownChart } from '../components/DrawdownChart';
import { SignalTable } from '../components/SignalTable';
import { EmptyState } from '../components/EmptyState';

export const BacktestAnalytics: React.FC = () => {
  const {
    dataGenerated,
    backtestResult, setBacktestResult,
    setRiskReview, setReport,
    alphaFormula, dataPath, signalMode,
    upperQuantile, lowerQuantile, transactionCost, slippage,
    setLoading,
    setError,
  } = useResearchStore();

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
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const formatPct = (val: number) => `${(val * 100).toFixed(2)}%`;
  const formatNum = (val: number) => val.toFixed(2);

  if (!dataGenerated) {
    return (
      <EmptyState
        title="Dataset Missing"
        description="A synthetic asset price path must be generated first. Configure parameters and click Gen Data in the toolbar."
      />
    );
  }

  if (!backtestResult) {
    return (
      <EmptyState
        title="No Simulation Calculated"
        description="Vectorized alpha backtester parses expression thresholds to execute long/short/flat simulation."
        actionLabel="Execute Historical Backtest"
        onAction={handleRunBacktest}
      />
    );
  }

  const { metrics } = backtestResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Top row metric tiles */}
      <div className="metric-tiles-grid">
        <MetricTile label="Total Return" value={formatPct(metrics.total_return)} />
        <MetricTile label="Sharpe Ratio" value={formatNum(metrics.sharpe)} />
        <MetricTile label="Max Drawdown" value={formatPct(metrics.max_drawdown)} />
        <MetricTile label="Win Rate" value={formatPct(metrics.win_rate)} />
        <MetricTile label="Profit Factor" value={formatNum(metrics.profit_factor)} />
        <MetricTile label="Turnover Ratio" value={formatPct(metrics.turnover)} />
        <MetricTile label="Trades Count" value={metrics.number_of_trades} />
        <MetricTile label="Exposure Ratio" value={formatNum(metrics.exposure_ratio)} />
      </div>

      {/* Main workspace layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left Side: Charts and benchmark metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <Panel title="Equity Simulation Curves">
            <EquityChart
              dates={backtestResult.dates}
              strategyCurve={backtestResult.equity_curve}
              benchmarkCurve={backtestResult.buy_hold_equity_curve}
              height={260}
            />
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginTop: '0.4rem', textAlign: 'right' }}>
              Benchmark uses the same synthetic single-asset price path.
            </div>
          </Panel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Panel title="Drawdown Profile">
              <DrawdownChart
                dates={backtestResult.dates}
                drawdownCurve={backtestResult.drawdown}
                height={160}
              />
            </Panel>

            <Panel title="Benchmark Comparison Metrics">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px', padding: '0.25rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Buy & Hold Return:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    {formatPct(metrics.buy_hold_total_return)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Excess Return vs B&H:</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                    color: metrics.strategy_excess_return_vs_buy_hold >= 0 ? 'var(--accent-teal)' : 'var(--risk-red)',
                  }}>
                    {formatPct(metrics.strategy_excess_return_vs_buy_hold)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Correlation to Asset:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    {formatNum(metrics.strategy_correlation_to_asset_return)}
                  </span>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Right Side: Ledger ledger */}
        <Panel title="Recent Signal Ledger events" style={{ height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SignalTable
              dates={backtestResult.dates}
              prices={backtestResult.prices}
              signals={backtestResult.signals}
              strategyReturns={backtestResult.strategy_returns}
              equityCurve={backtestResult.equity_curve}
              limit={25}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
};
