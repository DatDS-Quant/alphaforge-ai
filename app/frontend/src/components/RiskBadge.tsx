import React from 'react';

interface RiskBadgeProps {
  decision: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ decision }) => {
  const norm = decision.toUpperCase();
  let className = 'term-badge gray';

  if (norm === 'APPROVE' || norm === 'APPROVED' || norm === 'VALID') {
    className = 'term-badge teal';
  } else if (norm === 'REDUCE' || norm === 'WARNING') {
    className = 'term-badge amber';
  } else if (norm === 'REJECT' || norm === 'REJECTED' || norm === 'INVALID') {
    className = 'term-badge red';
  } else if (norm === 'READY') {
    className = 'term-badge gold';
  }

  return <span className={className}>{decision}</span>;
};
