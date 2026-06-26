import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface EquityChartProps {
  dates: string[];
  strategyCurve: number[];
  benchmarkCurve?: number[];
  height?: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  dates,
  strategyCurve,
  benchmarkCurve,
  height = 320,
}) => {
  const data = dates.map((date, idx) => ({
    name: date,
    Strategy: parseFloat((strategyCurve[idx] || 1.0).toFixed(4)),
    Benchmark: benchmarkCurve ? parseFloat((benchmarkCurve[idx] || 1.0).toFixed(4)) : undefined,
  }));

  // Downsample to keep performance high
  const downsampledData = data.filter((_, idx) => {
    if (data.length <= 300) return true;
    const step = Math.ceil(data.length / 300);
    return idx % step === 0 || idx === data.length - 1;
  });

  return (
    <div style={{ width: '100%', height, minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="Strategy"
            stroke="var(--accent-teal)"
            dot={false}
            strokeWidth={1.8}
            activeDot={{ r: 4 }}
          />
          {benchmarkCurve && (
            <Line
              type="monotone"
              dataKey="Benchmark"
              stroke="var(--text-muted)"
              dot={false}
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
