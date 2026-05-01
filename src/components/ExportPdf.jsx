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

export default function ExportPdf({ sources, sourceCosts, destinationCosts, destinations, customDests, customDestCosts, customerName }) {
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

  const canExport = totalSourceMonthly > 0 && Object.keys(destinationCosts).length > 0;

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
          <h1>Database Migration Cost Comparison Report</h1>
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
