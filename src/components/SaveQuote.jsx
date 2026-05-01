import { useState } from 'react';
import { formatCurrency, calculateSavings } from '../utils/calculations.js';

// Azure Function endpoint
const FUNCTION_URL = 'https://func-migration-quotes.azurewebsites.net/api/save-quote';

export default function SaveQuote({ sources, sourceCosts, destinationCosts, destinations, customDests, customDestCosts, customerName }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const totalSourceMonthly = sources.reduce((sum, source, idx) => {
    const cost = sourceCosts[idx];
    if (!cost) return sum;
    return sum + (source.customMonthlyCost || cost.monthlyTotal || 0);
  }, 0);

  const handleSave = async () => {
    if (!customerName) {
      setError('Please enter a customer name before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setResult(null);

    const bestDest = Object.entries(destinationCosts)
      .filter(([, c]) => c && c.monthlyTotal > 0)
      .sort((a, b) => a[1].monthlyTotal - b[1].monthlyTotal)[0];

    const totalDestMonthly = bestDest ? bestDest[1].monthlyTotal : 0;
    const savings = calculateSavings(totalSourceMonthly, totalDestMonthly);

    const payload = {
      customerName,
      sources: sources.map(s => ({
        sourceType: s.sourceType,
        servers: s.servers,
        coresPerServer: s.coresPerServer,
        ramPerServer: s.ramPerServer,
        storageGbPerServer: s.storageGbPerServer,
        haRequired: s.haRequired,
      })),
      sourceCosts: sourceCosts.map(c => ({
        monthlyTotal: c.monthlyTotal,
        sourceType: c.sourceType,
      })),
      destinations: Object.entries(destinationCosts).map(([key, cost]) => ({
        type: key,
        monthlyTotal: cost.monthlyTotal,
        annualTotal: cost.annualTotal,
        pricingTerm: cost.pricingTerm,
        hybridBenefit: cost.hybridBenefitApplied,
      })),
      destinationCosts,
      totalSourceMonthly,
      totalDestMonthly,
      savingsMonthly: savings.amount,
      savingsPercentage: savings.percentage,
    };

    try {
      const resp = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`Server responded with ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="save-quote-bar">
      <button className="btn-save-quote" onClick={handleSave} disabled={saving || totalSourceMonthly === 0}>
        💾 {saving ? 'Saving...' : 'Save Quote to Fabric'}
      </button>
      {error && <span className="save-error">❌ {error}</span>}
      {result && <span className="save-success">✅ Saved! ID: {result.id}</span>}
    </div>
  );
}
