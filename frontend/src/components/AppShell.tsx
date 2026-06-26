import React from 'react';
import { TopNav } from './TopNav';
import { TerminalToolbar } from './TerminalToolbar';
import { StatusStrip } from './StatusStrip';
import { LeftRail } from './LeftRail';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <TopNav />
      <TerminalToolbar />
      <StatusStrip />
      <div className="workspace-frame">
        <LeftRail />
        <main className="terminal-content">{children}</main>
      </div>
    </div>
  );
};
