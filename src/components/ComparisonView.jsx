import { formatCurrency, calculateSavings } from '../utils/calculations.js';

const SOURCE_TYPE_LABELS = {
  'oracle': 'Oracle Database',
  'ibm-db2': 'IBM Db2',
  'postgresql-self': 'PostgreSQL (self-hosted)',
  'mysql-self': 'MySQL (self-hosted)',
  'aws-rds-oracle': 'AWS RDS for Oracle',
  'aws-rds-postgresql': 'AWS RDS for PostgreSQL',
  'aws-rds-mysql': 'AWS RDS for MySQL',
  'aws-aurora': 'Amazon Aurora',
  'gcp-postgresql': 'GCP Cloud SQL PostgreSQL',
  'gcp-mysql': 'GCP Cloud SQL MySQL',
  'gcp-sqlserver': 'GCP Cloud SQL SQL Server',
};

export default function ComparisonView({ sourceCosts, destinationCosts, sources }) {
  const totalSourceMonthly = sources.reduce((sum, source, idx) => {
    const cost = sourceCosts[idx];
    if (!cost) return sum;
    const effective = source.customMonthlyCost || cost.monthlyTotal || 0;
    return sum + effective;
  }, 0);

  if (totalSourceMonthly === 0) {
    return (
      <div className="comparison-view card">
        <h2>📈 Cost Comparison</h2>
        <p className="empty-state">Configure your source environment(s) to see comparison results</p>
      </div>
    );
  }

  const DEST_LABELS = {
    azureSqlMi: { name: 'Azure SQL MI', color: '#0078d4' },
    azureSqlDb: { name: 'Azure SQL DB', color: '#50e6ff' },
    sqlOnVm: { name: 'SQL on VM', color: '#00a4ef' },
  };

  return (
    <div className="comparison-view card">
      <h2>📈 Cost Comparison</h2>

      {/* Source cost summary - now aggregated */}
      <div className="source-summary">
        <h3>Current Cost (All Sources Combined)</h3>
        <div className="cost-big">{formatCurrency(totalSourceMonthly)}<span className="period">/month</span></div>
        <div className="cost-annual">{formatCurrency(totalSourceMonthly * 12)} /year</div>

        {sourceCosts.length > 1 && (
          <table className="breakdown-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th style={{ textAlign: 'left', fontSize: 12 }}>Source</th><th style={{ textAlign: 'right', fontSize: 12 }}>Monthly</th></tr>
            </thead>
            <tbody>
              {sourceCosts.map((cost, idx) => {
                const source = sources[idx];
                if (!source || !source.sourceType) return null;
                const effective = source.customMonthlyCost || cost.monthlyTotal || 0;
                return (
                  <tr key={source.id}>
                    <td>{SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType} ({source.servers} server{source.servers > 1 ? 's' : ''})</td>
                    <td className="amount">{formatCurrency(effective)}/mo{source.customMonthlyCost ? ' *' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {sources.some(s => s.customMonthlyCost > 0) && (
          <p className="disclaimer" style={{ marginTop: 8 }}>* Using custom override cost</p>
        )}
      </div>

      {/* Destination comparisons */}
      <div className="destinations-grid">
        {Object.entries(destinationCosts).map(([destKey, destCost]) => {
          if (!destCost || destCost.monthlyTotal === 0) return null;
          const savings = calculateSavings(totalSourceMonthly, destCost.monthlyTotal);
          const meta = DEST_LABELS[destKey];
          const isSaving = savings.amount > 0;

          return (
            <div key={destKey} className={`dest-card ${isSaving ? 'saving' : 'more-expensive'}`}>
              <div className="dest-header" style={{ borderLeftColor: meta.color }}>
                <h4>{meta.name}</h4>
                <div className="dest-cost">{formatCurrency(destCost.monthlyTotal)}<span className="period">/mo</span></div>
                <div className="cost-annual">{formatCurrency(destCost.annualTotal)} /year</div>
              </div>

              <div className={`savings-badge ${isSaving ? 'positive' : 'negative'}`}>
                {isSaving
                  ? `✅ Save ${formatCurrency(savings.amount)}/mo (${savings.percentage.toFixed(1)}%)`
                  : `📈 Costs ${formatCurrency(Math.abs(savings.amount))}/mo more (${Math.abs(savings.percentage).toFixed(1)}%)`
                }
              </div>

              <div className="annual-impact">
                <strong>Annual {isSaving ? 'Savings' : 'Increase'}:</strong> {formatCurrency(Math.abs(savings.amount * 12))}
              </div>

              {destCost.breakdown && (
                <table className="breakdown-table small">
                  <tbody>
                    {destCost.breakdown.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.item}</td>
                        <td className="amount">{formatCurrency(item.monthly)}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {destCost.hybridBenefitApplied && (
                <div className="badge">🏷️ Hybrid Benefit Applied</div>
              )}
              <div className="badge term">📅 {destCost.pricingTerm === 'payg' ? 'Pay-as-you-go' : destCost.pricingTerm === 'reserved1yr' ? '1-Year Reserved' : '3-Year Reserved'}</div>
            </div>
          );
        })}
      </div>

      {/* Total environment summary */}
      <div className="total-summary">
        <h3>💰 Total Environment Summary</h3>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Option</th>
              <th>Monthly</th>
              <th>Annual</th>
              <th>vs Source</th>
            </tr>
          </thead>
          <tbody>
            <tr className="source-row">
              <td><strong>Current (All Sources)</strong></td>
              <td>{formatCurrency(totalSourceMonthly)}</td>
              <td>{formatCurrency(totalSourceMonthly * 12)}</td>
              <td>—</td>
            </tr>
            {Object.entries(destinationCosts).map(([destKey, destCost]) => {
              if (!destCost || destCost.monthlyTotal === 0) return null;
              const savings = calculateSavings(totalSourceMonthly, destCost.monthlyTotal);
              return (
                <tr key={destKey}>
                  <td>{DEST_LABELS[destKey].name}</td>
                  <td>{formatCurrency(destCost.monthlyTotal)}</td>
                  <td>{formatCurrency(destCost.annualTotal)}</td>
                  <td className={savings.amount > 0 ? 'positive' : 'negative'}>
                    {savings.amount > 0 ? '↓' : '↑'} {Math.abs(savings.percentage).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
