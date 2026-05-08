import { useMemo } from 'react';
import { powerBiPricing } from '../data/powerBiPricing.js';
import { calculateBiMigration } from '../utils/biCalculations.js';

const COMPLEXITY_OPTIONS = [
  { value: 'low', label: 'Low — Simple dashboards, standard connections' },
  { value: 'medium', label: 'Medium — Custom SQL, parameters, some LOD calcs' },
  { value: 'high', label: 'High — Complex calcs, embedded, row-level security' },
];

const DEPLOYMENT_OPTIONS = [
  { value: 'server', label: 'Tableau Server (Self-Hosted)' },
  { value: 'online', label: 'Tableau Cloud (Online)' },
];

const POWERBI_LICENSE_OPTIONS = [
  { value: 'pro', label: 'Power BI Pro ($10/user/mo)' },
  { value: 'premiumPerUser', label: 'Power BI Premium Per User ($20/user/mo)' },
  { value: 'capacity', label: 'Fabric Capacity (F-SKU)' },
];

export default function BiMigration({ biConfig, onBiConfigChange }) {
  const update = (key, value) => onBiConfigChange({ ...biConfig, [key]: value });
  const {
    tableauDeployment, creators, explorers, viewers, workbooks,
    dataSources, extracts, refreshFrequency, complexity, powerBiLicense,
    hasM365E5, selectedCapacitySku, hourlyRate, useCustomTableauCost,
    customTableauMonthlyCost,
  } = biConfig;
  const setTableauDeployment = v => update('tableauDeployment', v);
  const setCreators = v => update('creators', v);
  const setExplorers = v => update('explorers', v);
  const setViewers = v => update('viewers', v);
  const setWorkbooks = v => update('workbooks', v);
  const setDataSources = v => update('dataSources', v);
  const setExtracts = v => update('extracts', v);
  const setRefreshFrequency = v => update('refreshFrequency', v);
  const setComplexity = v => update('complexity', v);
  const setPowerBiLicense = v => update('powerBiLicense', v);
  const setHasM365E5 = v => update('hasM365E5', v);
  const setSelectedCapacitySku = v => update('selectedCapacitySku', v);
  const setHourlyRate = v => update('hourlyRate', v);
  const setUseCustomTableauCost = v => update('useCustomTableauCost', v);
  const setCustomTableauMonthlyCost = v => update('customTableauMonthlyCost', v);

  const calculations = useMemo(() => calculateBiMigration(biConfig), [biConfig]);

  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  return (
    <div className="bi-migration">
      <h2>📊 BI Migration: Tableau → Power BI</h2>
      <p className="section-note">Compare Tableau licensing costs against Power BI / Microsoft Fabric and estimate migration effort.</p>

      <div className="bi-grid">
        {/* LEFT: Tableau Source */}
        <div className="bi-panel card">
          <h3>Current Tableau Environment</h3>

          <div className="form-group">
            <label>Deployment Type</label>
            <select value={tableauDeployment} onChange={e => setTableauDeployment(e.target.value)}>
              {DEPLOYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Creators</label>
              <input type="number" min="0" value={creators} onChange={e => setCreators(+e.target.value)} />
            </div>
            <div className="form-group">
              <label>Explorers</label>
              <input type="number" min="0" value={explorers} onChange={e => setExplorers(+e.target.value)} />
            </div>
            <div className="form-group">
              <label>Viewers</label>
              <input type="number" min="0" value={viewers} onChange={e => setViewers(+e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Workbooks / Dashboards</label>
              <input type="number" min="0" value={workbooks} onChange={e => setWorkbooks(+e.target.value)} />
            </div>
            <div className="form-group">
              <label>Data Sources</label>
              <input type="number" min="0" value={dataSources} onChange={e => setDataSources(+e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Extracts</label>
              <input type="number" min="0" value={extracts} onChange={e => setExtracts(+e.target.value)} />
            </div>
            <div className="form-group">
              <label>Refreshes/Day</label>
              <input type="number" min="0" value={refreshFrequency} onChange={e => setRefreshFrequency(+e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Migration Complexity</label>
            <select value={complexity} onChange={e => setComplexity(e.target.value)}>
              {COMPLEXITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={useCustomTableauCost} onChange={e => setUseCustomTableauCost(e.target.checked)} />
              Override with actual Tableau monthly cost
            </label>
            {useCustomTableauCost && (
              <input type="number" min="0" placeholder="Monthly cost ($)" value={customTableauMonthlyCost}
                onChange={e => setCustomTableauMonthlyCost(+e.target.value)} />
            )}
          </div>
        </div>

        {/* RIGHT: Power BI Destination */}
        <div className="bi-panel card">
          <h3>Power BI / Fabric Target</h3>

          <div className="form-group">
            <label>Licensing Model</label>
            <select value={powerBiLicense} onChange={e => setPowerBiLicense(e.target.value)}>
              {POWERBI_LICENSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {powerBiLicense === 'pro' && (
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={hasM365E5} onChange={e => setHasM365E5(e.target.checked)} />
                Already have Microsoft 365 E5 (Power BI Pro included)
              </label>
            </div>
          )}

          {powerBiLicense === 'capacity' && (
            <div className="form-group">
              <label>Fabric Capacity SKU</label>
              <select value={selectedCapacitySku} onChange={e => setSelectedCapacitySku(+e.target.value)}>
                {powerBiPricing.capacity.skus.map((sku, i) => (
                  <option key={sku.name} value={i}>
                    {sku.name} — {fmt(sku.monthlyCost)}/mo ({sku.description})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Implementation Hourly Rate ($)</label>
            <input type="number" min="50" value={hourlyRate} onChange={e => setHourlyRate(+e.target.value)} />
          </div>

          {/* Results */}
          <div className="bi-results">
            <h4>Cost Comparison</h4>
            <div className="cost-compare-row">
              <div className="cost-box tableau">
                <span className="cost-label">Tableau (Current)</span>
                <span className="cost-value">{fmt(calculations.tableauMonthlyCost)}/mo</span>
                <span className="cost-annual">{fmt(calculations.tableauAnnualCost)}/yr</span>
              </div>
              <div className="cost-arrow">→</div>
              <div className="cost-box powerbi">
                <span className="cost-label">Power BI (Target)</span>
                <span className="cost-value">{fmt(calculations.powerBiMonthlyCost)}/mo</span>
                <span className="cost-annual">{fmt(calculations.powerBiAnnualCost)}/yr</span>
              </div>
            </div>

            {calculations.annualSavings > 0 && (
              <div className="savings-highlight">
                💰 Estimated savings: <strong>{fmt(calculations.annualSavings)}/year</strong> ({calculations.savingsPercent}%)
                {calculations.paybackMonths && (
                  <span className="payback"> • Payback in ~{calculations.paybackMonths} months</span>
                )}
              </div>
            )}
            {calculations.annualSavings <= 0 && (
              <div className="savings-highlight warning">
                ⚠️ Power BI cost is higher by {fmt(Math.abs(calculations.annualSavings))}/year at current configuration.
              </div>
            )}

            <h4>Migration Effort Estimate</h4>
            <table className="effort-table">
              <tbody>
                <tr><td>Workbook conversion</td><td>{Math.round(calculations.migration.workbookHours)} hrs</td></tr>
                <tr><td>Data source migration</td><td>{Math.round(calculations.migration.dataSourceHours)} hrs</td></tr>
                <tr><td>Extract → Dataflow/Lakehouse</td><td>{Math.round(calculations.migration.extractHours)} hrs</td></tr>
                <tr><td>User training ({calculations.totalUsers} users)</td><td>{Math.round(calculations.migration.trainingHours)} hrs</td></tr>
                <tr><td>Testing & validation (30%)</td><td>{Math.round(calculations.migration.testingHours)} hrs</td></tr>
                <tr className="total-row"><td><strong>Total effort</strong></td><td><strong>{Math.round(calculations.migration.totalHours)} hrs</strong></td></tr>
                <tr className="total-row"><td><strong>Estimated cost</strong></td><td><strong>{fmt(calculations.migration.totalCost)}</strong></td></tr>
              </tbody>
            </table>

            {calculations.powerBiBreakdown.length > 0 && (
              <>
                <h4>Power BI Cost Breakdown</h4>
                <ul className="breakdown-list">
                  {calculations.powerBiBreakdown.map((item, i) => (
                    <li key={i}>{item.label}: {fmt(item.annual)}/yr</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
