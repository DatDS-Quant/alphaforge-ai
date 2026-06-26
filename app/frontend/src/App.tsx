import React from 'react';
import { ResearchProvider, useResearchStore } from './state/researchStore';
import { AppShell } from './components/AppShell';
import { TerminalHome } from './pages/TerminalHome';
import { ResearchDesk } from './pages/ResearchDesk';
import { FormulaLab } from './pages/FormulaLab';
import { BacktestAnalytics } from './pages/BacktestAnalytics';
import { RiskReview } from './pages/RiskReview';
import { ResearchMemo } from './pages/ResearchMemo';
import { Artifacts } from './pages/Artifacts';
import './styles/globals.css';

const WorkspaceContent: React.FC = () => {
  const { activeTab } = useResearchStore();

  switch (activeTab) {
    case 'Home':
      return <TerminalHome />;
    case 'Research Desk':
      return <ResearchDesk />;
    case 'Formula Lab':
      return <FormulaLab />;
    case 'Backtest':
      return <BacktestAnalytics />;
    case 'Risk':
      return <RiskReview />;
    case 'Memo':
      return <ResearchMemo />;
    case 'Artifacts':
      return <Artifacts />;
    default:
      return <TerminalHome />;
  }
};

function App() {
  return (
    <ResearchProvider>
      <AppShell>
        <WorkspaceContent />
      </AppShell>
    </ResearchProvider>
  );
}

export default App;
