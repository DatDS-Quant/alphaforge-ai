import React from 'react';
import { useResearchStore } from '../state/useResearchStore';

export const Tabs: React.FC = () => {
  const { activeTab, setActiveTab } = useResearchStore();

  const tabList = [
    'Research Desk',
    'Formula Lab',
    'Backtest Lab',
    'Risk Review',
    'Research Memo',
    'Experiment Artifacts',
  ];

  return (
    <div className="tabs-container">
      {tabList.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
