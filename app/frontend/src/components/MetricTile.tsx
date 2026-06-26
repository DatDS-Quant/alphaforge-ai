import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  style?: React.CSSProperties;
}

export const MetricTile: React.FC<MetricTileProps> = ({ label, value, style }) => {
  return (
    <div className="metric-tile" style={style}>
      <span className="metric-tile-label">{label}</span>
      <span className="metric-tile-value">{value}</span>
    </div>
  );
};
