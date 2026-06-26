import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { apiClient } from '../api/client';
import { Panel } from '../components/Panel';
import { RiskBadge } from '../components/RiskBadge';

export const FormulaLab: React.FC = () => {
  const {
    alphaFormula, setAlphaFormula,
    dataPath,
    dataGenerated,
    validation, setValidation,
    loading, setLoading,
    setError,
  } = useResearchStore();

  const handleValidate = async () => {
    if (!dataGenerated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.evaluateAlpha({
        formula: alphaFormula,
        data_path: dataPath,
      });
      setValidation(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate formula');
    } finally {
      setLoading(false);
    }
  };

  const formulaExamples = [
    { title: 'Momentum Trend', expr: 'rank(momentum(close, 20))' },
    { title: 'Volume-weighted Mean Reversion', expr: 'zscore(volume, 60) * rank(momentum(close, 20))' },
    { title: 'Mean Reversion Z-Score', expr: '-zscore(close, 20)' },
    { title: 'Volatility-adjusted Momentum', expr: 'rank(momentum(close, 20)) - zscore(ts_std(close, 20), 60)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '100%' }}>
      {/* Left panel: Editor & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Panel title="Formula Editor">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div className="rail-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label>Mathematical Alpha Equation Expression</label>
              <textarea
                className="rail-textarea"
                style={{ flex: 1, minHeight: '120px', fontSize: '13px', lineHeight: '1.5' }}
                value={alphaFormula}
                onChange={(e) => setAlphaFormula(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              {!dataGenerated ? (
                <div className="term-alert warning">
                  Generate data first to evaluate formula values.
                </div>
              ) : (
                <button
                  onClick={handleValidate}
                  disabled={loading || !alphaFormula.trim()}
                  style={{ width: '100%', height: '28px', fontSize: '11px' }}
                >
                  {loading ? 'Analyzing syntax...' : 'Validate Formula'}
                </button>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Alpha Operator Reference Examples">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '11px' }}>
            {formulaExamples.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border)',
                  padding: '0.4rem 0.6rem',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => setAlphaFormula(ex.expr)}
              >
                <strong>{ex.title}</strong>
                <code style={{ color: 'var(--accent-gold)', fontSize: '10px' }}>{ex.expr}</code>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Right panel: Validation Details */}
      <Panel title="AST Validation Checker Analysis">
        {validation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <strong>Validation Status:</strong>
              <RiskBadge decision={validation.status} />
            </div>

            {validation.error ? (
              <div className="term-alert error">
                <strong>Syntax / Operator Error:</strong>
                <p style={{ marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>{validation.error}</p>
              </div>
            ) : (
              <>
                <div>
                  <strong>Referenced Asset Fields (Columns):</strong>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {validation.referenced_columns.map((c, i) => (
                      <span key={i} style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        padding: '0.15rem 0.4rem',
                        fontSize: '10px',
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong>Referenced Operators:</strong>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {validation.referenced_operators.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>None</span>
                    ) : (
                      validation.referenced_operators.map((o, i) => (
                        <span key={i} style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          padding: '0.15rem 0.4rem',
                          fontSize: '10px',
                        }}>
                          {o}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="term-alert success">
                  <strong>AST Safety Check Passed</strong>
                  <p style={{ marginTop: '0.2rem', lineHeight: '1.4' }}>
                    The formula syntax was parsed successfully. There are no unsafe operations, attribute resolutions, or namespace injections detected. Ready for historical simulation backtest execution.
                  </p>
                </div>
              </>
            )}
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
            Click Validate Formula to analyze expression tokens and check compiler safety.
          </div>
        )}
      </Panel>
    </div>
  );
};
