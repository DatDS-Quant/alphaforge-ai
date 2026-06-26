import React from 'react';
import { Sidebar } from './Sidebar';
import { TopStatusBar } from './TopStatusBar';
import { Tabs } from './Tabs';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="workspace">
        <TopStatusBar />
        <Tabs />
        <main className="panel-container">{children}</main>
      </div>
    </div>
  );
};
