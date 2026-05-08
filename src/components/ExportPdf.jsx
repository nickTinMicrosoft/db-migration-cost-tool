import { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
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

const DEST_LABELS = {
  azureSqlMi: 'Azure SQL Managed Instance',
  azureSqlDb: 'Azure SQL Database',
  sqlOnVm: 'SQL Server on Azure VM',
};

export default function ExportPdf({ sources, sourceCosts, destinationCosts, destinations, customDests, customDestCosts, customerName, biConfig, biCalculations }) {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const totalSourceMonthly = sources.reduce((sum, source, idx) => {
    const cost = sourceCosts[idx];
    if (!cost) return sum;
    return sum + (source.customMonthlyCost || cost.monthlyTotal || 0);
  }, 0);

  const handleExport = async () => {
    setExporting(true);
    const element = reportRef.current;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `migration-cost-comparison-${customerName ? customerName.replace(/[^a-zA-Z0-9]/g, '-') + '-' : ''}${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const hasBiData = biCalculations && biCalculations.tableauAnnualCost > 0;
  const canExport = (totalSourceMonthly > 0 && Object.keys(destinationCosts).length > 0) || hasBiData;

  return (
    <>
      <div className="export-bar">
        <button className="btn-export" onClick={handleExport} disabled={!canExport || exporting}>
          📄 {exporting ? 'Generating PDF...' : 'Export Report to PDF'}
        </button>
      </div>

      {/* Hidden PDF report content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={reportRef} className="pdf-report">
          <h1>{hasBiData ? 'Migration Cost Comparison Report' : 'Database Migration Cost Comparison Report'}</h1>
          {customerName && <h2 style={{ color: '#323130', border: 'none', marginTop: 4 }}>Prepared for: {customerName}</h2>}
          <p className="report-date">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          {/* Source Environment Summary */}
          <h2>Source Environment</h2>
          <table>
            <thead>
              <tr>
                <th>System</th>
                <th>Servers</th>
                <th>Cores/Server</th>
                <th>RAM/Server</th>
                <th>Storage/Server</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source, idx) => {
                if (!source.sourceType) return null;
                const cost = sourceCosts[idx];
                const effective = source.customMonthlyCost || cost?.monthlyTotal || 0;
                return (
                  <tr key={source.id}>
                    <td>{SOURCE_TYPE_LABELS[source.sourceType] || source.sourceType}</td>
                    <td>{source.servers}</td>
                    <td>{source.coresPerServer}</td>
                    <td>{source.ramPerServer} GB</td>
                    <td>{source.storageGbPerServer} GB</td>
                    <td>{formatCurrency(effective)}{source.customMonthlyCost ? ' *' : ''}</td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 'bold', background: '#f3f2f1' }}>
                <td colSpan={5}>Total Current Monthly Cost</td>
                <td>{formatCurrency(totalSourceMonthly)}</td>
              </tr>
            </tbody>
          </table>
          {sources.some(s => s.customMonthlyCost > 0) && (
            <p style={{ fontSize: 11, color: '#605e5c' }}>* Custom cost override provided by user</p>
          )}

          {/* Destination Options */}
          <h2>Microsoft Destination Options</h2>
          <table>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Configuration</th>
                <th>Pricing Term</th>
                <th>Hybrid Benefit</th>
                <th>Monthly Cost</th>
                <th>Annual Cost</th>
                <th>vs Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(destinationCosts).map(([destKey, destCost]) => {
                if (!destCost) return null;
                const savings = calculateSavings(totalSourceMonthly, destCost.monthlyTotal);
                const dest = destinations[destKey];
                const isSaving = savings.amount > 0;
                const termLabel = dest.pricingTerm === 'payg' ? 'Pay-as-you-go' : dest.pricingTerm === 'reserved1yr' ? '1-Year Reserved' : '3-Year Reserved';

                return (
                  <tr key={destKey}>
                    <td>{DEST_LABELS[destKey]}</td>
                    <td>{destCost.breakdown?.[0]?.item || '—'}</td>
                    <td>{termLabel}</td>
                    <td>{dest.useHybridBenefit ? 'Yes' : 'No'}</td>
                    <td>{formatCurrency(destCost.monthlyTotal)}</td>
                    <td>{formatCurrency(destCost.annualTotal)}</td>
                    <td className={isSaving ? 'savings-positive' : 'savings-negative'}>
                      {isSaving ? `↓ ${savings.percentage.toFixed(1)}%` : `↑ ${Math.abs(savings.percentage).toFixed(1)}%`}
                      {' '}({isSaving ? 'Save' : 'More'} {formatCurrency(Math.abs(savings.amount))}/mo)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Annual Impact Summary */}
          <h2>Annual Financial Impact</h2>
          <table>
            <thead>
              <tr>
                <th>Option</th>
                <th>Annual Cost</th>
                <th>Annual Savings / (Increase)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Current Environment</strong></td>
                <td>{formatCurrency(totalSourceMonthly * 12)}</td>
                <td>—</td>
              </tr>
              {Object.entries(destinationCosts).map(([destKey, destCost]) => {
                if (!destCost) return null;
                const savings = calculateSavings(totalSourceMonthly, destCost.monthlyTotal);
                const isSaving = savings.amount > 0;
                return (
                  <tr key={destKey}>
                    <td>{DEST_LABELS[destKey]}</td>
                    <td>{formatCurrency(destCost.annualTotal)}</td>
                    <td className={isSaving ? 'savings-positive' : 'savings-negative'}>
                      {isSaving ? `Save ${formatCurrency(savings.amount * 12)}/year` : `(${formatCurrency(Math.abs(savings.amount * 12))}/year more)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Best option highlight */}
          {(() => {
            const bestOption = Object.entries(destinationCosts)
              .filter(([, c]) => c && c.monthlyTotal > 0)
              .sort((a, b) => a[1].monthlyTotal - b[1].monthlyTotal)[0];
            if (!bestOption) return null;
            const [bestKey, bestCost] = bestOption;
            const bestSavings = calculateSavings(totalSourceMonthly, bestCost.monthlyTotal);
            if (bestSavings.amount <= 0) return null;
            return (
              <div style={{ background: '#d4edda', padding: 12, borderRadius: 6, marginTop: 16 }}>
                <strong>✅ Recommended:</strong> {DEST_LABELS[bestKey]} offers the best value with annual savings of {formatCurrency(bestSavings.amount * 12)} ({bestSavings.percentage.toFixed(1)}% reduction).
              </div>
            );
          })()}

          {/* BI Migration Section */}
          {hasBiData && (
            <>
              <h2 style={{ borderTop: '2px solid #0078d4', paddingTop: 16, marginTop: 24 }}>BI Platform Migration: Tableau → Power BI</h2>

              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Monthly Cost</th>
                    <th>Annual Cost</th>
                    <th>vs Current</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tableau ({biConfig.tableauDeployment === 'server' ? 'Server' : 'Cloud'})</td>
                    <td>{formatCurrency(biCalculations.tableauMonthlyCost)}</td>
                    <td>{formatCurrency(biCalculations.tableauAnnualCost)}</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Power BI / Fabric</td>
                    <td>{formatCurrency(biCalculations.powerBiMonthlyCost)}</td>
                    <td>{formatCurrency(biCalculations.powerBiAnnualCost)}</td>
                    <td className={biCalculations.annualSavings > 0 ? 'savings-positive' : 'savings-negative'}>
                      {biCalculations.annualSavings > 0
                        ? `↓ ${biCalculations.savingsPercent}% (Save ${formatCurrency(biCalculations.annualSavings)}/yr)`
                        : `↑ ${Math.abs(parseFloat(biCalculations.savingsPercent))}% (${formatCurrency(Math.abs(biCalculations.annualSavings))}/yr more)`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>

              {biCalculations.powerBiBreakdown.length > 0 && (
                <>
                  <h3>Power BI Cost Breakdown</h3>
                  <table>
                    <thead>
                      <tr><th>Item</th><th>Annual Cost</th></tr>
                    </thead>
                    <tbody>
                      {biCalculations.powerBiBreakdown.map((item, i) => (
                        <tr key={i}><td>{item.label}</td><td>{formatCurrency(item.annual)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <h3>Migration Effort Estimate</h3>
              <table>
                <thead>
                  <tr><th>Task</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  <tr><td>Workbook / dashboard conversion</td><td>{Math.round(biCalculations.migration.workbookHours)}</td></tr>
                  <tr><td>Data source migration</td><td>{Math.round(biCalculations.migration.dataSourceHours)}</td></tr>
                  <tr><td>Extract → Dataflow / Lakehouse</td><td>{Math.round(biCalculations.migration.extractHours)}</td></tr>
                  <tr><td>User training ({biCalculations.totalUsers} users)</td><td>{Math.round(biCalculations.migration.trainingHours)}</td></tr>
                  <tr><td>Testing &amp; validation (30%)</td><td>{Math.round(biCalculations.migration.testingHours)}</td></tr>
                  <tr style={{ fontWeight: 'bold', background: '#f3f2f1' }}>
                    <td>Total effort</td><td>{Math.round(biCalculations.migration.totalHours)} hrs</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', background: '#f3f2f1' }}>
                    <td>Estimated migration cost</td><td>{formatCurrency(biCalculations.migration.totalCost)}</td>
                  </tr>
                </tbody>
              </table>

              {biCalculations.paybackMonths && (
                <div style={{ background: '#d4edda', padding: 12, borderRadius: 6, marginTop: 12 }}>
                  <strong>💰 BI Migration ROI:</strong> Estimated payback period of ~{biCalculations.paybackMonths} months
                  with annual savings of {formatCurrency(biCalculations.annualSavings)}.
                </div>
              )}
            </>
          )}

          {/* Combined Total Summary */}
          {hasBiData && totalSourceMonthly > 0 && Object.keys(destinationCosts).length > 0 && (() => {
            const bestDbOption = Object.entries(destinationCosts)
              .filter(([, c]) => c && c.monthlyTotal > 0)
              .sort((a, b) => a[1].monthlyTotal - b[1].monthlyTotal)[0];
            if (!bestDbOption) return null;
            const [bestKey, bestCost] = bestDbOption;
            const combinedCurrentAnnual = (totalSourceMonthly * 12) + biCalculations.tableauAnnualCost;
            const combinedTargetAnnual = bestCost.annualTotal + biCalculations.powerBiAnnualCost;
            const combinedSavings = combinedCurrentAnnual - combinedTargetAnnual;
            const combinedPct = combinedCurrentAnnual > 0 ? ((combinedSavings / combinedCurrentAnnual) * 100).toFixed(1) : 0;
            return (
              <div style={{ background: '#e8f4fd', padding: 16, borderRadius: 6, marginTop: 20, border: '1px solid #0078d4' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0078d4' }}>📊 Combined Migration Summary</h3>
                <table>
                  <thead>
                    <tr><th>Category</th><th>Current Annual</th><th>Target Annual</th><th>Annual Savings</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Database Migration (→ {DEST_LABELS[bestKey]})</td>
                      <td>{formatCurrency(totalSourceMonthly * 12)}</td>
                      <td>{formatCurrency(bestCost.annualTotal)}</td>
                      <td>{formatCurrency((totalSourceMonthly * 12) - bestCost.annualTotal)}</td>
                    </tr>
                    <tr>
                      <td>BI Platform (→ Power BI)</td>
                      <td>{formatCurrency(biCalculations.tableauAnnualCost)}</td>
                      <td>{formatCurrency(biCalculations.powerBiAnnualCost)}</td>
                      <td>{formatCurrency(biCalculations.annualSavings)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', background: '#f3f2f1' }}>
                      <td>Total</td>
                      <td>{formatCurrency(combinedCurrentAnnual)}</td>
                      <td>{formatCurrency(combinedTargetAnnual)}</td>
                      <td className={combinedSavings > 0 ? 'savings-positive' : 'savings-negative'}>
                        {combinedSavings > 0
                          ? `Save ${formatCurrency(combinedSavings)}/yr (${combinedPct}%)`
                          : `(${formatCurrency(Math.abs(combinedSavings))}/yr more)`
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          <p className="disclaimer-text">
            <strong>Disclaimer:</strong> This report is for estimation purposes only. All pricing is based on publicly available list prices as of May 2026.
            Actual costs may vary based on negotiated contracts, enterprise agreements, volume discounts, and specific configuration requirements.
            Pricing sources: Azure Retail Pricing, Oracle Technology Price List, AWS RDS Pricing, Google Cloud SQL Pricing.
            This analysis does not include migration labor costs, application refactoring, downtime, or training expenses.
          </p>
        </div>
      </div>
    </>
  );
}
