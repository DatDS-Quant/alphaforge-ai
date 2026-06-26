import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DrawdownChartProps {
  dates: string[];
  drawdownCurve: number[];
  height?: number;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  dates,
  drawdownCurve,
  height = 180,
}) => {
  const data = dates.map((date, idx) => ({
    name: date,
    Drawdown: parseFloat(((drawdownCurve[idx] || 0) * 100).toFixed(2)),
  }));

  const downsampledData = data.filter((_, idx) => {
    if (data.length <= 300) return true;
    const step = Math.ceil(data.length / 300);
    return idx % step === 0 || idx === data.length - 1;
  });

  return (
    <div style={{ width: '100%', height, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={downsampledData}
          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={9}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            domain={['auto', 0]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Drawdown']}
            contentStyle={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="Drawdown"
            stroke="var(--risk-red)"
            fill="rgba(255, 74, 90, 0.08)"
            dot={false}
            strokeWidth={1.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
