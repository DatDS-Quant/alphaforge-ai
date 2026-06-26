import React from 'react';
import { useResearchStore } from '../state/researchStore';
import { useWorkflowActions } from '../hooks/useWorkflowActions';

export const LeftRail: React.FC = () => {
  const {
    days, setDays,
    seed, setSeed,
    scenario, setScenario,
    dataPath, setDataPath,
    alphaFormula, setAlphaFormula,
    upperQuantile, setUpperQuantile,
    lowerQuantile, setLowerQuantile,
    transactionCost, setTransactionCost,
    slippage, setSlippage,
    loading,
  } = useResearchStore();

  const { generateData } = useWorkflowActions();

  return (
    <aside className="left-rail">
      {/* Data Setup */}
      <div className="rail-section">
        <h3 className="rail-section-title">Data Setup</h3>
        
        <div className="rail-form-group">
          <label>Days</label>
          <input
            type="number"
            className="rail-input"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            disabled={loading}
          />
        </div>

        <div className="rail-form-group">
          <label>Seed</label>
          <input
            type="number"
            className="rail-input"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            disabled={loading}
          />
        </div>

        <div className="rail-form-group">
          <label>Scenario</label>
          <select
            className="rail-select"
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

        <div className="rail-form-group">
          <label>Data Path</label>
          <input
            type="text"
            className="rail-input"
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          onClick={generateData}
          disabled={loading}
          style={{ width: '100%', height: '24px', fontSize: '10px', marginTop: '0.5rem' }}
        >
          {loading ? 'Generating...' : 'Generate Data'}
        </button>
      </div>

      {/* Signal Setup */}
      <div className="rail-section">
        <h3 className="rail-section-title">Signal Setup</h3>

        <div className="rail-form-group">
          <label>Formula Expression</label>
          <textarea
            className="rail-textarea"
            rows={3}
            value={alphaFormula}
            onChange={(e) => setAlphaFormula(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="rail-form-group">
          <label>Upper Threshold</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="rail-input"
            value={upperQuantile}
            onChange={(e) => setUpperQuantile(parseFloat(e.target.value) || 0.0)}
            disabled={loading}
          />
        </div>

        <div className="rail-form-group">
          <label>Lower Threshold</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="rail-input"
            value={lowerQuantile}
            onChange={(e) => setLowerQuantile(parseFloat(e.target.value) || 0.0)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Execution Costs */}
      <div className="rail-section">
        <h3 className="rail-section-title">Costs & Slippage</h3>

        <div className="rail-form-group">
          <label>Transaction Cost</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            className="rail-input"
            value={transactionCost}
            onChange={(e) => setTransactionCost(parseFloat(e.target.value) || 0.0)}
            disabled={loading}
          />
        </div>

        <div className="rail-form-group">
          <label>Slippage Rate</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            className="rail-input"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.0)}
            disabled={loading}
          />
        </div>
      </div>
    </aside>
  );
};
