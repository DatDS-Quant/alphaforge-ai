import React, { createContext, useContext, useState } from 'react';
import type {
  AlphaGenerateResponse,
  AlphaEvaluateResponse,
  BacktestRunResponse,
  RiskEvaluateResponse,
  ReportGenerateResponse,
  ExperimentSaveResponse,
} from '../api/types';

export interface ResearchStore {
  // Parameters
  days: number;
  seed: number;
  scenario: string;
  dataPath: string;
  alphaFormula: string;
  signalMode: string;
  upperQuantile: number;
  lowerQuantile: number;
  transactionCost: number;
  slippage: number;

  // Active Navigation
  activeTab: string;

  // API Responses
  alphaIdea: AlphaGenerateResponse | null;
  validation: AlphaEvaluateResponse | null;
  backtestResult: BacktestRunResponse | null;
  riskReview: RiskEvaluateResponse | null;
  report: ReportGenerateResponse | null;
  savedArtifact: ExperimentSaveResponse | null;
  savedArtifactsList: ExperimentSaveResponse[];

  // Data Status State
  dataGenerated: boolean;

  // Loading/Error
  loading: boolean;
  error: string | null;

  // Setters
  setDays: (v: number) => void;
  setSeed: (v: number) => void;
  setScenario: (v: string) => void;
  setDataPath: (v: string) => void;
  setAlphaFormula: (v: string) => void;
  setSignalMode: (v: string) => void;
  setUpperQuantile: (v: number) => void;
  setLowerQuantile: (v: number) => void;
  setTransactionCost: (v: number) => void;
  setSlippage: (v: number) => void;

  setActiveTab: (v: string) => void;
  
  setAlphaIdea: (v: AlphaGenerateResponse | null) => void;
  setValidation: (v: AlphaEvaluateResponse | null) => void;
  setBacktestResult: (v: BacktestRunResponse | null) => void;
  setRiskReview: (v: RiskEvaluateResponse | null) => void;
  setReport: (v: ReportGenerateResponse | null) => void;
  setSavedArtifact: (v: ExperimentSaveResponse | null) => void;
  setDataGenerated: (v: boolean) => void;
  addSavedArtifact: (v: ExperimentSaveResponse) => void;
  
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  resetAll: () => void;

  // Derived Workflows Statuses
  alphaIdeaStatus: 'Empty' | 'Ready';
  dataStatus: 'Missing' | 'Ready';
  backtestStatus: 'Pending' | 'Completed';
  riskStatus: 'Pending' | 'APPROVE' | 'REDUCE' | 'REJECT';
  reportStatus: 'Pending' | 'Generated';
  artifactsStatus: 'Not Saved' | 'Saved';
}

const ResearchContext = createContext<ResearchStore | undefined>(undefined);

export const ResearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [days, setDays] = useState(1000);
  const [seed, setSeed] = useState(42);
  const [scenario, setScenario] = useState('random_walk');
  const [dataPath, setDataPath] = useState('data/sample_ohlcv.csv');
  const [alphaFormula, setAlphaFormula] = useState('rank(momentum(close, 20))');
  const [signalMode, setSignalMode] = useState('long_short');
  const [upperQuantile, setUpperQuantile] = useState(0.7);
  const [lowerQuantile, setLowerQuantile] = useState(0.3);
  const [transactionCost, setTransactionCost] = useState(0.0005);
  const [slippage, setSlippage] = useState(0.0005);

  const [activeTab, setActiveTab] = useState('Research Desk');

  const [alphaIdea, setAlphaIdea] = useState<AlphaGenerateResponse | null>(null);
  const [validation, setValidation] = useState<AlphaEvaluateResponse | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestRunResponse | null>(null);
  const [riskReview, setRiskReview] = useState<RiskEvaluateResponse | null>(null);
  const [report, setReport] = useState<ReportGenerateResponse | null>(null);
  const [savedArtifact, setSavedArtifact] = useState<ExperimentSaveResponse | null>(null);
  const [savedArtifactsList, setSavedArtifactsList] = useState<ExperimentSaveResponse[]>([]);

  const [dataGenerated, setDataGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSavedArtifact = (artifact: ExperimentSaveResponse) => {
    setSavedArtifact(artifact);
    setSavedArtifactsList((prev) => [...prev, artifact]);
  };

  const resetAll = () => {
    setAlphaIdea(null);
    setValidation(null);
    setBacktestResult(null);
    setRiskReview(null);
    setReport(null);
    setSavedArtifact(null);
    setError(null);
  };

  // Derived statuses
  const alphaIdeaStatus = alphaIdea ? 'Ready' : 'Empty';
  const dataStatus = dataGenerated ? 'Ready' : 'Missing';
  const backtestStatus = backtestResult ? 'Completed' : 'Pending';
  const riskStatus = riskReview ? riskReview.decision : 'Pending';
  const reportStatus = report ? 'Generated' : 'Pending';
  const artifactsStatus = savedArtifact ? 'Saved' : 'Not Saved';

  return (
    <ResearchContext.Provider
      value={{
        days,
        seed,
        scenario,
        dataPath,
        alphaFormula,
        signalMode,
        upperQuantile,
        lowerQuantile,
        transactionCost,
        slippage,
        activeTab,
        alphaIdea,
        validation,
        backtestResult,
        riskReview,
        report,
        savedArtifact,
        savedArtifactsList,
        dataGenerated,
        loading,
        error,
        setDays,
        setSeed,
        setScenario,
        setDataPath,
        setAlphaFormula,
        setSignalMode,
        setUpperQuantile,
        setLowerQuantile,
        setTransactionCost,
        setSlippage,
        setActiveTab,
        setAlphaIdea,
        setValidation,
        setBacktestResult,
        setRiskReview,
        setReport,
        setSavedArtifact,
        setDataGenerated,
        addSavedArtifact,
        setLoading,
        setError,
        resetAll,
        alphaIdeaStatus,
        dataStatus,
        backtestStatus,
        riskStatus,
        reportStatus,
        artifactsStatus,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearchStore = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearchStore must be used within a ResearchProvider');
  }
  return context;
};
