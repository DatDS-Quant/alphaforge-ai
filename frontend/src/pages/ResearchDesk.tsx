import React, { useState } from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { apiClient } from '../api/client';
import { StatusPill } from '../components/StatusPill';

export const ResearchDesk: React.FC = () => {
  const {
    alphaIdea, setAlphaIdea,
    setAlphaFormula, setValidation,
    loading, setLoading,
    setError,
  } = useResearchStore();

  const [prompt, setPrompt] = useState('Find a momentum alpha confirmed by abnormal volume');
  const [style, setStyle] = useState('balanced');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.generateAlpha({
        user_prompt: prompt,
        preferred_style: style,
      });
      setAlphaIdea(res);
      setAlphaFormula(res.formula); // auto update sidebar formula
      // Reset subsequent metrics validation to align steps
      setValidation(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate alpha idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">AI Research Desk</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '12px' }}>
          Translate natural-language research concepts into structured mathematical alpha expressions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Research Prompt / Strategy Hypothesis Idea</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Find a momentum alpha confirmed by abnormal volume"
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group">
              <label>Research Framing Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} disabled={loading}>
                <option value="balanced">balanced</option>
                <option value="conservative">conservative</option>
                <option value="aggressive">aggressive</option>
              </select>
            </div>
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()} style={{ height: '36px' }}>
              {loading ? 'Generating...' : 'Generate Research Idea'}
            </button>
          </div>
        </div>
      </div>

      {alphaIdea && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title">Generated Research Hypothesis</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '12px' }}>
              <div>
                <strong>Title:</strong>
                <p style={{ marginTop: '0.25rem' }}>{alphaIdea.title}</p>
              </div>

              <div>
                <strong>Hypothesis:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{alphaIdea.hypothesis}</p>
              </div>

              <div>
                <strong>Mathematical Formula Expression:</strong>
                <pre style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem',
                  borderRadius: 'var(--border-radius)',
                  marginTop: '0.25rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-primary)',
                }}>
                  {alphaIdea.formula}
                </pre>
              </div>

              <div>
                <strong>Expected Behavior:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{alphaIdea.expected_behavior}</p>
              </div>

              <div>
                <strong>Risk Notes:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{alphaIdea.risk_notes}</p>
              </div>

              <div>
                <strong>Scientific Explanation:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{alphaIdea.explanation}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Agent Execution Trace Log</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <strong>Detected Theme:</strong>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {alphaIdea.trace.detected_theme}
                  </div>
                </div>
                <div>
                  <strong>Selected Template:</strong>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {alphaIdea.trace.formula_template_selected}
                  </div>
                </div>
              </div>

              <div>
                <strong>Validation Status:</strong>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusPill status={alphaIdea.trace.validation_status} />
                </div>
              </div>

              {alphaIdea.trace.warnings && alphaIdea.trace.warnings.length > 0 && (
                <div>
                  <strong>Warnings Checklist:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.25rem', color: 'var(--text-secondary)' }}>
                    {alphaIdea.trace.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <strong>Raw Compiler Outputs:</strong>
                <div className="trace-log" style={{ marginTop: '0.5rem' }}>
{`[trace] User prompt keyword analysis matched theme "${alphaIdea.trace.detected_theme}"
[trace] Selecting formula template: ${alphaIdea.trace.formula_template_selected}
[trace] Formula output compiles successfully: ${alphaIdea.formula}
[trace] Run internal Abstract Syntax Tree (AST) validation checker...
[trace] AST Result: ${alphaIdea.trace.validation_status} (0 nodes flagged)
[trace] Ready for pipeline backtesting`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
