import React from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { DataTable } from '../components/DataTable';

export const ExperimentArtifacts: React.FC = () => {
  const { savedArtifactsList, setActiveTab } = useResearchStore();

  const columns = [
    { header: 'Experiment ID', accessor: 'experiment_id' },
    { header: 'Saved At', accessor: 'created_at' },
    { header: 'Report Path', accessor: 'report_path' },
    { header: 'Metadata Path', accessor: 'metadata_path' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">Saved Experiment Artifacts</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '12px' }}>
          This registry displays a session log of the experiment runs serialized to the local filesystem during your research.
        </p>

        {savedArtifactsList.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            textAlign: 'center',
            fontSize: '12px',
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
              <li>Generate daily synthetic pricing datasets in the sidebar.</li>
              <li>Translate or write a custom alpha formula in the <strong>Research Desk</strong>.</li>
              <li>Execute strategy historical backtesting in the <strong>Backtest Lab</strong>.</li>
              <li>Perform risk overlay checks in the <strong>Risk Review</strong> panel.</li>
              <li>Compile and save the report inside the <strong>Research Memo</strong> view.</li>
            </ol>
            <div>
              <button onClick={() => setActiveTab('Research Desk')}>
                Begin Research Workspace Pipeline
              </button>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={savedArtifactsList} />
        )}
      </div>

      <div className="alert-banner info" style={{ fontSize: '12px' }}>
        <strong>Future Platform Features:</strong>
        <span>
          A persistent database experiment store and registry, allowing SQL queries and strategy sorting, is scheduled for a future architectural development phase.
        </span>
      </div>
    </div>
  );
};
