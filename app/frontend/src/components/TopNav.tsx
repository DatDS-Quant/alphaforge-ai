import React from 'react';
import { useResearchStore } from '../state/researchStore';

export const TopNav: React.FC = () => {
  const { activeTab, setActiveTab } = useResearchStore();

  const tabList = [
    { key: 'Home', label: 'Home' },
    { key: 'Research Desk', label: 'Research Desk' },
    { key: 'Formula Lab', label: 'Formula Lab' },
    { key: 'Backtest', label: 'Backtest' },
    { key: 'Risk', label: 'Risk' },
    { key: 'Memo', label: 'Memo' },
    { key: 'Artifacts', label: 'Artifacts' },
  ];

  return (
    <header className="top-nav">
      <div className="brand-section">
        <span className="brand-name">AlphaForge Research Terminal</span>
        <span className="brand-subtitle">Signal Research, Backtesting, and Risk Review</span>
      </div>
      <nav className="nav-tabs">
        {tabList.map((tab) => (
          <button
            key={tab.key}
            className={`nav-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
