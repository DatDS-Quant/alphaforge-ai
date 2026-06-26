import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { Panel } from '../components/Panel';
import { DataGrid } from '../components/DataGrid';

export const Artifacts: React.FC = () => {
  const { savedArtifactsList, setActiveTab } = useResearchStore();

  const columns = [
    { header: 'Experiment ID', accessor: 'experiment_id' },
    { header: 'Saved At', accessor: 'created_at' },
    { header: 'Report File Path', accessor: 'report_path' },
    { header: 'Metadata File Path', accessor: 'metadata_path' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <Panel title="Session Experiment Artifact Registry">
        {savedArtifactsList.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            textAlign: 'center',
            fontSize: '11px',
          }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No experiments have been saved in the active session. Follow these research pipeline workflow steps to generate one:
            </p>
            <ol style={{
              display: 'inline-block',
              textAlign: 'left',
              margin: '0 auto 1.5rem auto',
              color: 'var(--text-secondary)',
              paddingLeft: '1.5rem',
              lineHeight: '1.8',
            }}>
              <li>Generate synthetic daily pricing datasets.</li>
              <li>Translate or write a custom alpha formula in the <strong>Research Desk</strong>.</li>
              <li>Execute strategy historical backtesting in the <strong>Backtest</strong> tab.</li>
              <li>Perform risk compliance checklist audit in the <strong>Risk</strong> tab.</li>
              <li>Compile and save the report inside the <strong>Memo</strong> view.</li>
            </ol>
            <div>
              <button
                onClick={() => setActiveTab('Research Desk')}
                style={{
                  backgroundColor: 'var(--accent-teal)',
                  color: 'var(--bg-base)',
                  fontSize: '11px',
                  height: '24px',
                  padding: '0 0.75rem',
                }}
              >
                Begin Research Pipeline
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowY: 'auto' }}>
            <DataGrid columns={columns} data={savedArtifactsList} />
          </div>
        )}
      </Panel>

      <Panel title="Future System Features: Persistent Store Database Registry">
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', lineHeight: '1.4' }}>
          A full SQL database integration with SQLAlchemy / SQLite is planned for subsequent development phases. This will enable strategy sorting, parameter indexing, and historical run comparison queries across multiple users.
        </p>
      </Panel>
    </div>
  );
};
