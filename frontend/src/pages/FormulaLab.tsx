import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';
import { WorkflowPrerequisites } from '../components/WorkflowPrerequisites';

export const FormulaLab: React.FC = () => {
  const {
    alphaFormula, setAlphaFormula,
    dataGenerated,
    validation,
    loading,
  } = useResearchStore();
  const { generateData, validateFormula } = useWorkflowActions();

  const formulaExamples = [
    { title: 'Momentum Trend', expr: 'rank(momentum(close, 20))' },
    { title: 'Volume-weighted Mean Reversion', expr: 'zscore(volume, 60) * rank(momentum(close, 20))' },
    { title: 'Mean Reversion Z-Score', expr: '-zscore(close, 20)' },
    { title: 'Volatility-adjusted Momentum', expr: 'rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Panel title="Formula Editor">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <div className="rail-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label>Alpha Formula</label>
              <textarea
                className="rail-textarea formula-editor"
                value={alphaFormula}
                onChange={(e) => setAlphaFormula(e.target.value)}
                disabled={loading}
              />
            </div>
            {!dataGenerated && (
              <div className="term-alert warning">Formula structure can be edited now, but value evaluation requires generated data.</div>
            )}
            <div className="workflow-actions-inline">
              <button onClick={generateData} disabled={loading}>{loading ? 'Generating...' : 'Generate Data'}</button>
              <button onClick={validateFormula} disabled={loading || !dataGenerated || !alphaFormula.trim()}>{loading ? 'Validating...' : 'Validate Formula'}</button>
            </div>
          </div>
        </Panel>

        <Panel title="Formula Examples">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px' }}>
            {formulaExamples.map((ex) => (
              <button className="formula-example" key={ex.title} onClick={() => setAlphaFormula(ex.expr)} disabled={loading}>
                <strong>{ex.title}</strong><code>{ex.expr}</code>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Validation Result">
        {validation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <strong>Status</strong>
              <RiskBadge decision={validation.is_valid ? 'VALID' : 'INVALID'} />
            </div>
            {!validation.is_valid ? (
              <div className="term-alert error">
                <strong>Formula errors</strong>
                <ul style={{ paddingLeft: '1rem', marginTop: '0.25rem' }}>
                  {validation.errors.map((err) => <li key={err}>{err}</li>)}
                </ul>
              </div>
            ) : (
              <>
                <div><strong>Referenced Columns</strong><div className="tag-row">{validation.referenced_columns.map((c) => <span key={c}>{c}</span>)}</div></div>
                <div><strong>Referenced Operators</strong><div className="tag-row">{validation.referenced_operators.length ? validation.referenced_operators.map((o) => <span key={o}>{o}</span>) : <span>None</span>}</div></div>
                <div className="term-alert success">Formula validated. Ready to run a backtest.</div>
              </>
            )}
          </div>
        ) : (
          <WorkflowPrerequisites
            title="Validation Pending"
            description="Generate data, then validate the active formula before backtesting."
            items={[
              { label: 'Data', status: dataGenerated ? 'Ready' : 'Missing', ready: dataGenerated },
              { label: 'Formula', status: alphaFormula.trim() ? 'Ready' : 'Missing', ready: !!alphaFormula.trim() },
            ]}
            primaryActionLabel={dataGenerated ? 'Validate Formula' : 'Generate Data'}
            onPrimaryAction={dataGenerated ? validateFormula : generateData}
            messageVariant={dataGenerated ? 'neutral' : 'warning'}
          />
        )}
      </Panel>
    </div>
  );
};