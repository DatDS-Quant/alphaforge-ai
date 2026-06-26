import React from 'react';

interface StatusPillProps {
  status: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const normalized = status.toUpperCase();
  let className = 'status-pill neutral';

  if (normalized === 'APPROVE' || normalized === 'APPROVED' || normalized === 'VALID' || normalized === 'READY') {
    className = 'status-pill approve';
  } else if (normalized === 'REDUCE' || normalized === 'WARNING') {
    className = 'status-pill reduce';
  } else if (normalized === 'REJECT' || normalized === 'REJECTED' || normalized === 'INVALID' || normalized === 'MISSING') {
    className = 'status-pill reject';
  }

  return <span className={className}>{status}</span>;
};
