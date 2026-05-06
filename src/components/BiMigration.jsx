import { useState, useMemo } from 'react';
import { tableauPricing } from '../data/tableauPricing.js';
import { powerBiPricing } from '../data/powerBiPricing.js';

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

export default function BiMigration() {
  const [tableauDeployment, setTableauDeployment] = useState('server');
  const [creators, setCreators] = useState(10);
  const [explorers, setExplorers] = useState(50);
  const [viewers, setViewers] = useState(200);
  const [workbooks, setWorkbooks] = useState(50);
  const [dataSources, setDataSources] = useState(20);
  const [extracts, setExtracts] = useState(15);
  const [refreshFrequency, setRefreshFrequency] = useState(8); // per day
  const [complexity, setComplexity] = useState('medium');
  const [powerBiLicense, setPowerBiLicense] = useState('pro');
  const [hasM365E5, setHasM365E5] = useState(false);
  const [selectedCapacitySku, setSelectedCapacitySku] = useState(2); // F8 index
  const [hourlyRate, setHourlyRate] = useState(175);
  const [useCustomTableauCost, setUseCustomTableauCost] = useState(false);
  const [customTableauMonthlyCost, setCustomTableauMonthlyCost] = useState(0);

  const calculations = useMemo(() => {
    const tp = tableauPricing[tableauDeployment];
    const totalUsers = creators + explorers + viewers;

    // Current Tableau cost (annual)
    let tableauAnnualCost;
    if (useCustomTableauCost) {
      tableauAnnualCost = customTableauMonthlyCost * 12;
    } else {
      const licenseCost =
        (creators * tp.userRoles.creator.annualPerUser) +
        (explorers * tp.userRoles.explorer.annualPerUser) +
        (viewers * tp.userRoles.viewer.annualPerUser);

      let infraCost = 0;
      if (tp.infrastructure) {
        infraCost = (tp.infrastructure.estimatedServerCostPerMonth +
          (tp.infrastructure.estimatedDbaHoursPerMonth * tp.infrastructure.estimatedDbaHourlyRate)) * 12;
      }
      tableauAnnualCost = licenseCost + infraCost;
    }
    const tableauMonthlyCost = tableauAnnualCost / 12;

    // Power BI cost (annual)
    let powerBiAnnualCost = 0;
    let powerBiBreakdown = [];

    if (powerBiLicense === 'capacity') {
      const sku = powerBiPricing.capacity.skus[selectedCapacitySku];
      powerBiAnnualCost = sku.monthlyCost * 12;
      powerBiBreakdown.push({ label: `Fabric ${sku.name} Capacity`, annual: powerBiAnnualCost });
      // Viewers still need Pro minimum for non-capacity workspaces (or use Fabric free viewers)
      // For capacity, viewers can access without per-user license
    } else {
      const tier = powerBiPricing.perUser[powerBiLicense];
      const licensedUsers = hasM365E5 && powerBiLicense === 'pro' ? 0 : totalUsers;
      powerBiAnnualCost = licensedUsers * tier.annualPerUser;
      if (hasM365E5 && powerBiLicense === 'pro') {
        powerBiBreakdown.push({ label: 'Power BI Pro (included in M365 E5)', annual: 0 });
      } else {
        powerBiBreakdown.push({ label: `${tier.name} × ${totalUsers} users`, annual: powerBiAnnualCost });
      }
    }

    // On-prem gateway cost
    if (tableauDeployment === 'server') {
      const gatewayCost = powerBiPricing.migrationCosts.powerBiGateway.infrastructureCostEstimate * 12;
      powerBiAnnualCost += gatewayCost;
      powerBiBreakdown.push({ label: 'On-premises Data Gateway (VM)', annual: gatewayCost });
    }

    const powerBiMonthlyCost = powerBiAnnualCost / 12;

    // Migration effort
    const effort = tableauPricing.migrationEffort;
    const complexityKey = complexity;
    const workbookHours = workbooks * effort.perWorkbook[complexityKey];
    const dataSourceHours = dataSources * effort.perDataSource[complexityKey];
    const extractHours = extracts * effort.perExtract[complexityKey];
    const trainingHours = totalUsers * effort.trainingPerUser;
    const subtotalHours = workbookHours + dataSourceHours + extractHours + trainingHours;
    const testingHours = subtotalHours * effort.testingMultiplier;
    const totalMigrationHours = subtotalHours + testingHours;
    const migrationCost = totalMigrationHours * hourlyRate;

    // Savings
    const annualSavings = tableauAnnualCost - powerBiAnnualCost;
    const monthlySavings = annualSavings / 12;
    const paybackMonths = annualSavings > 0 ? Math.ceil(migrationCost / (annualSavings / 12)) : null;

    return {
      tableauMonthlyCost,
      tableauAnnualCost,
      powerBiMonthlyCost,
      powerBiAnnualCost,
      powerBiBreakdown,
      annualSavings,
      monthlySavings,
      savingsPercent: tableauAnnualCost > 0 ? ((annualSavings / tableauAnnualCost) * 100).toFixed(1) : 0,
      migration: {
        workbookHours,
        dataSourceHours,
        extractHours,
        trainingHours,
        testingHours,
        totalHours: totalMigrationHours,
        totalCost: migrationCost,
      },
      paybackMonths,
      totalUsers,
    };
  }, [tableauDeployment, creators, explorers, viewers, workbooks, dataSources, extracts,
      refreshFrequency, complexity, powerBiLicense, hasM365E5, selectedCapacitySku,
      hourlyRate, useCustomTableauCost, customTableauMonthlyCost]);

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
