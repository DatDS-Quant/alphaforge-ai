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
  AreaChart,
  Area,
} from 'recharts';

interface ChartPanelProps {
  dates: string[];
  strategyCurve?: number[];
  benchmarkCurve?: number[];
  drawdownCurve?: number[];
  type: 'equity' | 'drawdown';
}

export const ChartPanel: React.FC<ChartPanelProps> = ({
  dates,
  strategyCurve,
  benchmarkCurve,
  drawdownCurve,
  type,
}) => {
  // Format data for Recharts
  if (type === 'equity') {
    const curve = strategyCurve || [];
    const data = dates.map((date, idx) => ({
      name: date,
      Strategy: parseFloat((curve[idx] || 1).toFixed(4)),
      Benchmark: benchmarkCurve ? parseFloat((benchmarkCurve[idx] || 1).toFixed(4)) : undefined,
    }));

    // Downsample chart data to keep it fast if there are too many data points (e.g., > 1000 days)
    const downsampledData = data.filter((_, idx) => {
      if (data.length <= 200) return true;
      const step = Math.ceil(data.length / 200);
      return idx % step === 0 || idx === data.length - 1;
    });

    return (
      <div style={{ width: '100%', height: 320, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={downsampledData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#242c3d" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141a29',
                borderColor: '#242c3d',
                color: '#f3f4f6',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="Strategy"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            {benchmarkCurve && (
              <Line
                type="monotone"
                dataKey="Benchmark"
                stroke="#6b7280"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  } else {
    // Drawdown chart
    const curve = drawdownCurve || [];
    const data = dates.map((date, idx) => ({
      name: date,
      Drawdown: parseFloat(((curve[idx] || 0) * 100).toFixed(2)), // in percentage
    }));

    const downsampledData = data.filter((_, idx) => {
      if (data.length <= 200) return true;
      const step = Math.ceil(data.length / 200);
      return idx % step === 0 || idx === data.length - 1;
    });

    return (
      <div style={{ width: '100%', height: 200, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={downsampledData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#242c3d" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 0]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Drawdown']}
              contentStyle={{
                backgroundColor: '#141a29',
                borderColor: '#242c3d',
                color: '#f3f4f6',
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="Drawdown"
              stroke="#ef4444"
              fill="rgba(239, 68, 68, 0.15)"
              dot={false}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
};
