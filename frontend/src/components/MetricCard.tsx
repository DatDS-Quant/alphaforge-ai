import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value">{value}</div>
    </div>
  );
};
