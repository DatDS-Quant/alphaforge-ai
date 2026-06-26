import React from 'react';
import { useResearchStore } from '../state/researchStore';

export const StatusStrip: React.FC = () => {
  const {
    alphaIdeaStatus,
    dataStatus,
    backtestStatus,
    riskStatus,
    reportStatus,
    artifactsStatus,
    validation,
  } = useResearchStore();

  const valStatus = validation ? (validation.is_valid ? 'VALID' : 'INVALID') : 'Pending';

  const getColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'READY' || s === 'COMPLETED' || s === 'APPROVE' || s === 'APPROVED' || s === 'VALID' || s === 'GENERATED' || s === 'SAVED') {
      return 'var(--accent-teal)';
    }
    if (s === 'REDUCE' || s === 'WARNING') {
      return 'var(--warning-amber)';
    }
    if (s === 'REJECT' || s === 'REJECTED' || s === 'MISSING' || s === 'EMPTY' || s === 'INVALID') {
      return 'var(--risk-red)';
    }
    return 'var(--text-secondary)';
  };

  return (
    <div className="status-strip">
      <div className="status-indicator">
        <span className="status-indicator-label">DATA:</span>
        <span style={{ color: getColor(dataStatus) }}>{dataStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">IDEA:</span>
        <span style={{ color: getColor(alphaIdeaStatus) }}>{alphaIdeaStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">VALIDATION:</span>
        <span style={{ color: getColor(valStatus) }}>{valStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">BACKTEST:</span>
        <span style={{ color: getColor(backtestStatus) }}>{backtestStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">RISK:</span>
        <span style={{ color: getColor(riskStatus) }}>{riskStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">MEMO:</span>
        <span style={{ color: getColor(reportStatus) }}>{reportStatus}</span>
      </div>
      <div className="status-indicator">
        <span className="status-indicator-label">ARTIFACTS:</span>
        <span style={{ color: getColor(artifactsStatus) }}>{artifactsStatus}</span>
      </div>
    </div>
  );
};
