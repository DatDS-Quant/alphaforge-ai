import React, { useState } from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';
import { WorkflowPrerequisites } from '../components/WorkflowPrerequisites';

export const ResearchMemo: React.FC = () => {
  const { alphaFormula, validation, backtestResult, riskReview, report, savedArtifact, loading, setActiveTab } = useResearchStore();
  const { generateMemo, saveArtifacts } = useWorkflowActions();
  const [memoOpen, setMemoOpen] = useState(true);

  if (!alphaFormula.trim()) {
    return (
      <WorkflowPrerequisites
        title="Formula Missing"
        description="Enter a generated or manual formula before compiling a memo."
        items={[{ label: 'Formula', status: 'Missing', ready: false }]}
        primaryActionLabel="Open Formula Lab"
        onPrimaryAction={() => setActiveTab('Formula Lab')}
        messageVariant="blocked"
      />
    );
  }

  if (!backtestResult) {
    return (
      <WorkflowPrerequisites
        title="Backtest Missing"
        description="Memo generation needs completed backtest metrics. Manual formula mode does not require a generated idea."
        items={[
          { label: 'Formula', status: 'Ready', ready: true },
          { label: 'Validation', status: validation?.is_valid ? 'Valid' : 'Pending', ready: !!validation?.is_valid },
          { label: 'Backtest', status: 'Missing', ready: false },
        ]}
        primaryActionLabel="Go to Backtest"
        onPrimaryAction={() => setActiveTab('Backtest')}
        messageVariant="blocked"
      />
    );
  }

  if (!riskReview) {
    return (
      <WorkflowPrerequisites
        title="Risk Review Missing"
        description="Compile the memo after risk review. A REJECT decision is still a valid memo result."
        items={[
          { label: 'Formula', status: 'Ready', ready: true },
          { label: 'Backtest', status: 'Completed', ready: true },
          { label: 'Risk decision', status: 'Missing', ready: false },
        ]}
        primaryActionLabel="Go to Risk"
        onPrimaryAction={() => setActiveTab('Risk')}
        messageVariant="warning"
      />
    );
  }

  if (!report) {
    return (
      <WorkflowPrerequisites
        title="Memo Ready"
        description="Compile validation, backtest metrics, and risk decision into a research memo. Generated idea is optional."
        items={[
          { label: 'Formula', status: 'Ready', ready: true },
          { label: 'Backtest', status: 'Completed', ready: true },
          { label: 'Risk decision', status: riskReview.decision, ready: true },
        ]}
        primaryActionLabel={loading ? 'Compiling...' : 'Compile Research Memo'}
        onPrimaryAction={generateMemo}
        messageVariant="success"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <Panel title="Research Verdict" action={<button onClick={generateMemo} disabled={loading} style={{ height: '22px', padding: '0 0.5rem', fontSize: '10px' }}>{loading ? 'Compiling...' : 'Compile Research Memo'}</button>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
          <div className="metric-tile"><span className="metric-tile-label">Decision</span><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><strong>{riskReview.decision}</strong><RiskBadge decision={riskReview.decision} /></div></div>
          <div className="metric-tile"><span className="metric-tile-label">Summary</span><span style={{ color: 'var(--text-secondary)' }}>{report.summary}</span></div>
          <div className="metric-tile"><span className="metric-tile-label">Key Metrics</span><span style={{ fontFamily: 'var(--font-mono)' }}>Return {(backtestResult.metrics.total_return * 100).toFixed(1)}% | Sharpe {backtestResult.metrics.sharpe.toFixed(2)} | DD {(backtestResult.metrics.max_drawdown * 100).toFixed(1)}%</span></div>
        </div>
      </Panel>

      <Panel title="Full Memo" action={<button className="secondary-action" onClick={() => setMemoOpen(!memoOpen)} style={{ height: '20px', padding: '0 0.5rem', fontSize: '10px' }}>{memoOpen ? 'Collapse' : 'Expand'}</button>}>
        {memoOpen && <pre className="memo-panel">{report.report_markdown}</pre>}
      </Panel>

      <Panel title="Save Experiment Artifacts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '11px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Save the memo and metadata to the local reports folder for this research run.</p>
          <button onClick={saveArtifacts} disabled={loading} style={{ width: 'fit-content', height: '26px', fontSize: '11px' }}>{loading ? 'Saving...' : 'Save Experiment Artifacts'}</button>
          {savedArtifact && (
            <div className="term-alert success">
              <strong>Artifacts saved.</strong>
              <div><strong>ID:</strong> <code>{savedArtifact.experiment_id}</code></div>
              <div><strong>Report:</strong> <code>{savedArtifact.report_path}</code></div>
              <div><strong>Metadata:</strong> <code>{savedArtifact.metadata_path}</code></div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};