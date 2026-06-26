import React from 'react';
import { DataGrid } from './DataGrid';

interface SignalTableProps {
  dates: string[];
  prices: number[];
  signals: number[];
  strategyReturns: number[];
  equityCurve: number[];
  limit?: number;
}

export const SignalTable: React.FC<SignalTableProps> = ({
  dates,
  prices,
  signals,
  strategyReturns,
  equityCurve,
  limit = 20,
}) => {
  const len = dates.length;
  const items = [];
  const count = Math.min(limit, len);

  for (let i = len - 1; i >= len - count; i--) {
    items.push({
      date: dates[i],
      price: prices[i] !== undefined ? prices[i].toFixed(2) : '0.00',
      signal: signals[i] !== undefined ? signals[i] : 0,
      ret: strategyReturns[i] !== undefined ? strategyReturns[i] : 0,
      equity: equityCurve[i] !== undefined ? equityCurve[i] : 1.0,
    });
  }

  const columns = [
    { header: 'Date', accessor: 'date' },
    {
      header: 'Signal',
      accessor: 'signal',
      render: (row: any) => {
        let text = 'HOLD';
        let color = 'var(--text-secondary)';
        if (row.signal > 0) {
          text = 'LONG';
          color = 'var(--accent-teal)';
        } else if (row.signal < 0) {
          text = 'SHORT';
          color = 'var(--risk-red)';
        }
        return <span style={{ color, fontWeight: 'bold' }}>{text} ({row.signal})</span>;
      },
    },
    { header: 'Price', accessor: 'price' },
    {
      header: 'PnL (Return)',
      accessor: 'ret',
      render: (row: any) => {
        const val = row.ret * 100;
        let color = 'var(--text-primary)';
        let sign = '';
        if (val > 0) {
          color = 'var(--accent-teal)';
          sign = '+';
        } else if (val < 0) {
          color = 'var(--risk-red)';
        }
        return (
          <span style={{ color, fontWeight: '600' }}>
            {sign}{val.toFixed(3)}%
          </span>
        );
      },
    },
    {
      header: 'Equity Curve',
      accessor: 'equity',
      render: (row: any) => row.equity.toFixed(4),
    },
  ];

  return <DataGrid columns={columns} data={items} />;
};
