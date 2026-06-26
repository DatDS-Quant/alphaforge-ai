import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';

export const ResearchDesk: React.FC = () => {
  const {
    userPrompt, setUserPrompt,
    preferredStyle, setPreferredStyle,
    alphaIdea, setAlphaIdea,
    setAlphaFormula, setValidation,
    loading, setLoading,
    setError,
  } = useResearchStore();

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.generateAlpha({
        user_prompt: userPrompt,
        preferred_style: preferredStyle,
      });
      setAlphaIdea(res);
      setAlphaFormula(res.formula);
      setValidation(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate alpha idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '1rem', height: '100%' }}>
      {/* Left panel: Input config */}
      <Panel title="Research Parameters">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
          <div className="rail-form-group">
            <label>Hypothesis Input Concept</label>
            <textarea
              className="rail-textarea"
              rows={4}
              style={{ fontFamily: 'inherit', fontSize: '12px' }}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g. Find a momentum alpha confirmed by abnormal volume"
              disabled={loading}
            />
          </div>

          <div className="rail-form-group">
            <label>Framing Strategy Style</label>
            <select
              className="rail-select"
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value)}
              disabled={loading}
            >
              <option value="balanced">balanced</option>
              <option value="conservative">conservative</option>
              <option value="aggressive">aggressive</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !userPrompt.trim()}
            style={{ width: '100%', height: '28px', fontSize: '11px', marginTop: 'auto' }}
          >
            {loading ? 'Compiling Concept...' : 'Generate Research Idea'}
          </button>
        </div>
      </Panel>

      {/* Center panel: Generated Proposal */}
      <Panel title="Quantitative Proposal Specification">
        {alphaIdea ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '11px', overflowY: 'auto' }}>
            <div>
              <strong>Target Title:</strong>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '0.15rem' }}>{alphaIdea.title}</div>
            </div>

            <div>
              <strong>Working Hypothesis:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.4' }}>
                {alphaIdea.hypothesis}
              </p>
            </div>

            <div>
              <strong>Mathematical Alpha Expression:</strong>
              <pre style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                padding: '0.5rem',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-teal)',
                fontSize: '11px',
                marginTop: '0.25rem',
                overflowX: 'auto',
              }}>
                {alphaIdea.formula}
              </pre>
            </div>

            <div>
              <strong>Expected Pricing Behavior:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.4' }}>
                {alphaIdea.expected_behavior}
              </p>
            </div>

            <div>
              <strong>Risk and Limitations Notes:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.4' }}>
                {alphaIdea.risk_notes}
              </p>
            </div>

            <div>
              <strong>Research Justification / Explanation:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.4' }}>
                {alphaIdea.explanation}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            Enter a prompt on the left and click Generate to propose an alpha strategy.
          </div>
        )}
      </Panel>

      {/* Right panel: Agent Trace logs */}
      <Panel title="Model Decision Trace">
        {alphaIdea ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '11px', height: '100%' }}>
            <div>
              <strong>Classified Theme:</strong>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', marginTop: '0.15rem' }}>
                {alphaIdea.trace.detected_theme}
              </div>
            </div>

            <div>
              <strong>Selected Equation Template:</strong>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)', marginTop: '0.15rem' }}>
                {alphaIdea.trace.formula_template_selected}
              </div>
            </div>

            <div>
              <strong>Trace Validation Code:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                <RiskBadge decision={alphaIdea.trace.validation_status} />
              </div>
            </div>

            {alphaIdea.trace.warnings && alphaIdea.trace.warnings.length > 0 && (
              <div>
                <strong>Trace Warnings:</strong>
                <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: 0, color: 'var(--text-secondary)' }}>
                  {alphaIdea.trace.warnings.map((w, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
              <strong>Execution Trace Log Output:</strong>
              <pre className="trace-log" style={{ flex: 1, marginTop: '0.25rem', overflowY: 'auto' }}>
{`[trace] Analyzed prompt keywords
[trace] Matched theme: ${alphaIdea.trace.detected_theme}
[trace] Loaded equation template: ${alphaIdea.trace.formula_template_selected}
[trace] Sandbox validates formula AST checks: ${alphaIdea.trace.validation_status}
[trace] Trace outputs completed`}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            Decision trace logs will render upon proposal compilation.
          </div>
        )}
      </Panel>
    </div>
  );
};
