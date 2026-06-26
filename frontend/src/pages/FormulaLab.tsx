import React from 'react';
import { useResearchStore } from '../state/useResearchStore';
import { apiClient } from '../api/client';
import { StatusPill } from '../components/StatusPill';

export const FormulaLab: React.FC = () => {
  const {
    alphaFormula,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!dataGenerated ? (
        <div className="alert-banner warning">
          <strong>Dataset Missing</strong>
          <span style={{ fontSize: '12px' }}>
            A synthetic single-asset price dataset has not been generated yet. Please configure and trigger <strong>Generate Data</strong> in the left settings panel first.
          </span>
        </div>
      ) : (
        <>
          <div className="card">
            <h3 className="card-title">Formula Lab</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '12px' }}>
              Inspect, analyze, and test the active mathematical alpha formula. This validates that the formula parses safely via the Python AST compiler.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Active Formula Expression</label>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: '1rem',
                  color: 'var(--text-primary)',
                }}>
                  {alphaFormula}
                </div>
              </div>

              <div>
                <button onClick={handleValidate} disabled={loading}>
                  {loading ? 'Evaluating...' : 'Validate Formula AST'}
                </button>
              </div>
            </div>
          </div>

          {validation && (
            <div className="card">
              <h3 className="card-title">Validation Analysis</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <strong>AST Safety Decision:</strong>
                  <StatusPill status={validation.status} />
                </div>

                {validation.error ? (
                  <div className="alert-banner error">
                    <strong>Compilation/Operator Error:</strong>
                    <span>{validation.error}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="metric-card">
                        <span className="metric-card-label">Referenced Asset Columns</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {validation.referenced_columns.map((c, i) => (
                            <span key={i} style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '11px',
                              backgroundColor: 'var(--bg-hover)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '2px',
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="metric-card">
                        <span className="metric-card-label">Referenced Operators</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {validation.referenced_operators.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>None</span>
                          ) : (
                            validation.referenced_operators.map((o, i) => (
                              <span key={i} style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '11px',
                                backgroundColor: 'var(--bg-hover)',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '2px',
                              }}>
                                {o}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="alert-banner success">
                      <strong>Valid Syntax</strong>
                      <span>
                        The AST compiler verified that this expression contains only supported lookahead-free functions and safe variable references. It is ready for backtesting execution.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
