import React from 'react';
import { ResearchProvider, useResearchStore } from './state/useResearchStore';
import { Layout } from './components/Layout';
import { ResearchDesk } from './pages/ResearchDesk';
import { FormulaLab } from './pages/FormulaLab';
import { BacktestLab } from './pages/BacktestLab';
import { RiskReview } from './pages/RiskReview';
import { ResearchReport } from './pages/ResearchReport';
import { ExperimentArtifacts } from './pages/ExperimentArtifacts';
import './styles/globals.css';

const WorkspaceContent: React.FC = () => {
  const { activeTab } = useResearchStore();

  switch (activeTab) {
    case 'Research Desk':
      return <ResearchDesk />;
    case 'Formula Lab':
      return <FormulaLab />;
    case 'Backtest Lab':
      return <BacktestLab />;
    case 'Risk Review':
      return <RiskReview />;
    case 'Research Memo':
      return <ResearchReport />;
    case 'Experiment Artifacts':
      return <ExperimentArtifacts />;
    default:
      return <ResearchDesk />;
  }
};

function App() {
  return (
    <ResearchProvider>
      <Layout>
        <WorkspaceContent />
      </Layout>
    </ResearchProvider>
  );
}

export default App;
