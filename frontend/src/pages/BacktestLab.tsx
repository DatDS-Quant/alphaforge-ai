import React from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { ChartPanel } from '../components/ChartPanel';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';

export const BacktestLab: React.FC = () => {
  const {
    dataGenerated,
    backtestResult,
    setLoading,
    setError,
    setBacktestResult,
    alphaFormula,
    dataPath,
    signalMode,
    upperQuantile,
    lowerQuantile,
    transactionCost,
    slippage,
  } = useResearchStore();

  const handleRunBacktest = async () => {
    if (!dataGenerated) return;
    setLoading(true);
    setError(null);
    try {
      const { apiClient } = await import('../api/client');
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
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const formatPct = (val: number) => `${(val * 100).toFixed(2)}%`;
  const formatNum = (val: number) => val.toFixed(2);

  // Parse recent signals table rows
  const getRecentSignals = () => {
    if (!backtestResult) return [];
    const { dates, prices, signals, strategy_returns } = backtestResult;
    const len = dates.length;
    const items = [];
    const count = Math.min(15, len);
    for (let i = len - 1; i >= len - count; i--) {
      items.push({
        date: dates[i],
        price: prices[i] ? prices[i].toFixed(2) : '0.00',
        signal: signals[i],
        ret: strategy_returns[i] ? `${(strategy_returns[i] * 100).toFixed(3)}%` : '0.000%',
      });
    }
    return items;
  };

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Asset Price', accessor: 'price' },
    {
      header: 'Signal',
      accessor: 'signal',
      render: (row: any) => {
        let color = 'var(--text-secondary)';
        if (row.signal > 0) color = 'var(--color-approve)';
        if (row.signal < 0) color = 'var(--color-reject)';
        return <span style={{ color, fontWeight: 'bold' }}>{row.signal}</span>;
      },
    },
    { header: 'Strategy return', accessor: 'ret' },
  ];

  if (!dataGenerated) {
    return (
      <EmptyState
        title="Dataset Missing"
        description="A synthetic single-asset price dataset has not been generated yet. Please generate data first to run backtests."
      />
    );
  }

  if (!backtestResult) {
    return (
      <EmptyState
        title="No Backtest Executed"
        description="Run a vectorized strategy backtest using the sidebar action buttons or click below to evaluate performance."
        actionLabel="Execute Vectorized Backtest"
        onAction={handleRunBacktest}
      />
    );
  }

  const { metrics } = backtestResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">Backtest Lab</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '12px' }}>
          Evaluate historical simulation equity curves and performance metrics.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '0.75rem' }}>Performance Curves (Strategy vs Buy-and-Hold)</h4>
            <ChartPanel
              type="equity"
              dates={backtestResult.dates}
              strategyCurve={backtestResult.equity_curve}
              benchmarkCurve={backtestResult.buy_hold_equity_curve}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '0.5rem' }}>
              Benchmark comparison uses the same synthetic single-asset price path.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '0.75rem' }}>Strategy Drawdown Profile</h4>
            <ChartPanel
              type="drawdown"
              dates={backtestResult.dates}
              strategyCurve={[]}
              drawdownCurve={backtestResult.drawdown}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Quantitative Performance Metrics</h3>
        <div className="metrics-grid">
          <MetricCard label="Strategy Total Return" value={formatPct(metrics.total_return)} />
          <MetricCard label="Ann. Return (Strategy)" value={formatPct(metrics.annualized_return)} />
          <MetricCard label="Sharpe Ratio" value={formatNum(metrics.sharpe)} />
          <MetricCard label="Sortino Ratio" value={formatNum(metrics.sortino)} />
          <MetricCard label="Max Drawdown" value={formatPct(metrics.max_drawdown)} />
          <MetricCard label="Win Rate" value={formatPct(metrics.win_rate)} />
          <MetricCard label="Profit Factor" value={formatNum(metrics.profit_factor)} />
          <MetricCard label="Turnover Ratio" value={formatPct(metrics.turnover)} />
          <MetricCard label="Trade Count" value={metrics.number_of_trades} />
          
          <MetricCard label="Buy & Hold Return" value={formatPct(metrics.buy_hold_total_return)} />
          <MetricCard label="Excess Return vs B&H" value={formatPct(metrics.strategy_excess_return_vs_buy_hold)} />
          <MetricCard label="Correlation to Asset" value={formatNum(metrics.strategy_correlation_to_asset_return)} />
          <MetricCard label="Exposure Ratio" value={formatNum(metrics.exposure_ratio)} />
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recent Historical Signals (Last 15 Days)</h3>
        <DataTable columns={columns} data={getRecentSignals()} />
      </div>
    </div>
  );
};
