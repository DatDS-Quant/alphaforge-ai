import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>{title}</h4>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '11px' }}>
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ marginTop: '0.5rem', fontSize: '11px', height: '24px', padding: '0 0.75rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
