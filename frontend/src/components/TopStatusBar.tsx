import React from 'react';
import { useResearchStore } from '../state/useResearchStore';

export const TopStatusBar: React.FC = () => {
  const {
    alphaIdeaStatus,
    dataStatus,
    backtestStatus,
    riskStatus,
    reportStatus,
    artifactsStatus,
  } = useResearchStore();

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'READY' || s === 'COMPLETED' || s === 'APPROVE' || s === 'GENERATED' || s === 'SAVED') {
      return 'var(--color-approve)';
    }
    if (s === 'REDUCE') {
      return 'var(--color-reduce)';
    }
    if (s === 'REJECT' || s === 'MISSING' || s === 'EMPTY') {
      return 'var(--color-reject)';
    }
    return 'var(--text-muted)';
  };

  return (
    <div className="top-status-bar">
      <div className="status-item">
        <span className="status-label">Alpha Idea</span>
        <span className="status-value" style={{ color: getStatusColor(alphaIdeaStatus) }}>
          {alphaIdeaStatus}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Data Status</span>
        <span className="status-value" style={{ color: getStatusColor(dataStatus) }}>
          {dataStatus}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Backtest</span>
        <span className="status-value" style={{ color: getStatusColor(backtestStatus) }}>
          {backtestStatus}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Risk Decision</span>
        <span className="status-value" style={{ color: getStatusColor(riskStatus) }}>
          {riskStatus}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Report Memo</span>
        <span className="status-value" style={{ color: getStatusColor(reportStatus) }}>
          {reportStatus}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Artifacts</span>
        <span className="status-value" style={{ color: getStatusColor(artifactsStatus) }}>
          {artifactsStatus}
        </span>
      </div>
    </div>
  );
};
