import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';

export const ResearchDesk: React.FC = () => {
  const {
    userPrompt, setUserPrompt,
    preferredStyle, setPreferredStyle,
    alphaIdea,
    loading,
  } = useResearchStore();
  const { generateIdea } = useWorkflowActions();
  const idea = alphaIdea?.idea;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: '1rem', height: '100%' }}>
      <Panel title="Research Prompt">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="rail-form-group">
            <label>Hypothesis Input Concept</label>
            <textarea
              className="rail-textarea"
              rows={5}
              style={{ fontFamily: 'inherit', fontSize: '12px' }}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g. Find a momentum alpha confirmed by abnormal volume"
              disabled={loading}
            />
          </div>
          <div className="rail-form-group">
            <label>Research Style</label>
            <select className="rail-select" value={preferredStyle} onChange={(e) => setPreferredStyle(e.target.value)} disabled={loading}>
              <option value="balanced">balanced</option>
              <option value="conservative">conservative</option>
              <option value="aggressive">aggressive</option>
            </select>
          </div>
          <button onClick={generateIdea} disabled={loading || !userPrompt.trim()} style={{ width: '100%', height: '28px', fontSize: '11px' }}>
            {loading ? 'Compiling Concept...' : 'Generate Research Idea'}
          </button>
          <div className="term-alert info">
            Idea generation can run before data. The generated formula is copied into the active formula editor.
          </div>
        </div>
      </Panel>

      <Panel title="Quantitative Proposal">
        {idea ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '11px', overflowY: 'auto' }}>
            <div className="term-alert success">Formula has been copied into the active formula editor.</div>
            <div><strong>Proposal Title</strong><div style={{ fontSize: '14px', fontWeight: 700, marginTop: '0.15rem' }}>{idea.title}</div></div>
            <div><strong>Hypothesis</strong><p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{idea.hypothesis}</p></div>
            <div><strong>Formula</strong><pre className="formula-block">{idea.formula}</pre></div>
            <div><strong>Expected Behavior</strong><p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{idea.expected_behavior}</p></div>
            <div>
              <strong>Risk Notes</strong>
              <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {idea.risk_notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
            <div><strong>Explanation</strong><p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{idea.explanation}</p></div>
          </div>
        ) : (
          <div className="empty-panel-copy">Enter a prompt, choose a style, then press Generate Research Idea.</div>
        )}
      </Panel>

      <Panel title="Agent Trace">
        {alphaIdea ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '11px' }}>
            <div><strong>Classified Theme</strong><div className="mono-highlight gold">{alphaIdea.trace.detected_theme}</div></div>
            <div><strong>Selected Template</strong><div className="mono-highlight teal">{alphaIdea.trace.formula_template}</div></div>
            <div><strong>Validation</strong><div style={{ marginTop: '0.25rem' }}><RiskBadge decision={alphaIdea.trace.validation_status} /></div></div>
            {alphaIdea.warnings.length > 0 && (
              <div>
                <strong>Warnings</strong>
                <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {alphaIdea.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </div>
            )}
            <pre className="trace-log">{`[trace] Analyzed prompt keywords\n[trace] Matched theme: ${alphaIdea.trace.detected_theme}\n[trace] Loaded template: ${alphaIdea.trace.formula_template}\n[trace] Validation status: ${alphaIdea.trace.validation_status}`}</pre>
          </div>
        ) : (
          <div className="empty-panel-copy">Trace appears after idea generation.</div>
        )}
      </Panel>
    </div>
  );
};