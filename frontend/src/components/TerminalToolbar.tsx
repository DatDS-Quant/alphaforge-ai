import React from 'react';
import { useResearchStore } from '../state/researchStore';

export const TerminalToolbar: React.FC = () => {
  const {
    scenario, setScenario,
    signalMode, setSignalMode,
    dataPath, setDataPath,
    alphaFormula,
    loading,
  } = useResearchStore();

  return (
    <div className="terminal-toolbar">
      <div className="toolbar-group">
        <div className="toolbar-item">
          <label>Scenario</label>
          <select
            className="toolbar-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={loading}
          >
            <option value="random_walk">random_walk</option>
            <option value="trend_up">trend_up</option>
            <option value="trend_down">trend_down</option>
            <option value="mean_reverting">mean_reverting</option>
            <option value="volatile">volatile</option>
          </select>
        </div>

        <div className="toolbar-item">
          <label>Mode</label>
          <select
            className="toolbar-select"
            value={signalMode}
            onChange={(e) => setSignalMode(e.target.value)}
            disabled={loading}
          >
            <option value="long_short">long_short</option>
            <option value="long_flat">long_flat</option>
          </select>
        </div>

        <div className="toolbar-item">
          <label>Path</label>
          <input
            type="text"
            className="toolbar-input"
            style={{ width: '130px' }}
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="toolbar-item">
          <label>Formula</label>
          <span className="toolbar-formula-preview" title={alphaFormula}>
            {alphaFormula || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};
