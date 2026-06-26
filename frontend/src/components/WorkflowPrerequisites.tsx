import React from 'react';

export interface PrerequisiteItem {
  label: string;
  status: string;
  ready: boolean;
}

interface WorkflowPrerequisitesProps {
  title: string;
  description: string;
  items: PrerequisiteItem[];
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  messageVariant?: 'neutral' | 'warning' | 'blocked' | 'success';
}

export const WorkflowPrerequisites: React.FC<WorkflowPrerequisitesProps> = ({
  title,
  description,
  items,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  messageVariant = 'warning',
}) => {
  const getAlertClass = () => {
    switch (messageVariant) {
      case 'success':
        return 'term-alert success';
      case 'blocked':
      case 'warning':
        return `term-alert ${messageVariant === 'blocked' ? 'error' : 'warning'}`;
      default:
        return 'term-alert info';
    }
  };

  return (
    <div className="terminal-panel" style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem' }}>
      <div className="terminal-panel-header" style={{ marginBottom: '1rem' }}>
        <h4 className="terminal-panel-title">{title}</h4>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.6rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)',
              fontSize: '11px',
            }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: item.ready ? 'var(--accent-teal)' : 'var(--risk-red)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: item.ready ? 'var(--accent-teal)' : 'var(--risk-red)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={getAlertClass()} style={{ marginBottom: '1.5rem' }}>
        <strong>Status:</strong> {messageVariant.toUpperCase()} - Prerequisites are required to unlock the next stage.
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onPrimaryAction}
          className="toolbar-btn primary-btn"
          style={{ flex: 1, height: '30px', justifyContent: 'center', fontWeight: 'bold' }}
        >
          {primaryActionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="toolbar-btn"
            style={{ flex: 1, height: '30px', justifyContent: 'center' }}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};