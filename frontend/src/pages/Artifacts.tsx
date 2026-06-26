import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { Panel } from '../components/Panel';
import { DataGrid } from '../components/DataGrid';
import { WorkflowPrerequisites } from '../components/WorkflowPrerequisites';

export const Artifacts: React.FC = () => {
  const { savedArtifactsList, report, savedArtifact, setActiveTab } = useResearchStore();

  const columns = [
    { header: 'Experiment ID', accessor: 'experiment_id' },
    { header: 'Saved At', accessor: 'created_at' },
    { header: 'Report File Path', accessor: 'report_path' },
    { header: 'Metadata File Path', accessor: 'metadata_path' },
  ];

  if (savedArtifactsList.length === 0) {
    return (
      <WorkflowPrerequisites
        title="No Artifacts Saved"
        description="Artifacts are created from the Memo page after a memo has been compiled. This session view is not a full experiment registry."
        items={[
          { label: 'Memo', status: report ? 'Generated' : 'Missing', ready: !!report },
          { label: 'Artifacts', status: 'Not Saved', ready: false },
        ]}
        primaryActionLabel="Go to Memo"
        onPrimaryAction={() => setActiveTab('Memo')}
        messageVariant={report ? 'warning' : 'blocked'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <Panel title="Saved Session Artifacts">
        <div style={{ overflowY: 'auto' }}><DataGrid columns={columns} data={savedArtifactsList} /></div>
      </Panel>
      {savedArtifact && (
        <Panel title="Latest Artifact Metadata Preview">
          <div className="stat-list">
            <div><span>Experiment ID</span><strong>{savedArtifact.experiment_id}</strong></div>
            <div><span>Report Path</span><strong>{savedArtifact.report_path}</strong></div>
            <div><span>Metadata Path</span><strong>{savedArtifact.metadata_path}</strong></div>
          </div>
        </Panel>
      )}
    </div>
  );
};