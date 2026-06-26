import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({ title, children, action, style }) => {
  return (
    <div className="terminal-panel" style={style}>
      <div className="terminal-panel-header">
        <h4 className="terminal-panel-title">{title}</h4>
        {action && <div style={{ fontSize: '10px' }}>{action}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};
