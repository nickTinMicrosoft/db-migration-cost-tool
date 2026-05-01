import { getAllTiersForDestination } from '../utils/suggestions.js';
import { formatCurrency, calculateSavings } from '../utils/calculations.js';

const DEST_TYPE_OPTIONS = [
  { value: 'azureSqlMi', label: 'Azure SQL Managed Instance', icon: '🔷' },
  { value: 'azureSqlDb', label: 'Azure SQL Database', icon: '🔶' },
  { value: 'sqlOnVm', label: 'SQL Server on Azure VM', icon: '💻' },
];

const PRICING_TERMS = [
  { value: 'payg', label: 'Pay-as-you-go' },
  { value: 'reserved1yr', label: '1-Year Reserved' },
  { value: 'reserved3yr', label: '3-Year Reserved' },
];

export default function DetailedBuilder({ customDests, customDestCosts, suggestions, sourceCosts, sources, onAdd, onRemove, onUpdate }) {
  const totalSourceMonthly = sources.reduce((sum, source, idx) => {
    const cost = sourceCosts[idx];
    if (!cost) return sum;
    return sum + (source.customMonthlyCost || cost.monthlyTotal || 0);
  }, 0);

  const handleChange = (dest, field, value) => {
    const updated = { ...dest, [field]: value };
    // Reset option index when type or tier changes
    if (field === 'destType') {
      const allTiers = getAllTiersForDestination(value);
      const firstTierKey = Object.keys(allTiers)[0];
      updated.tierKey = firstTierKey;
      updated.selectedOptionIndex = 0;
    }
    if (field === 'tierKey') {
      updated.selectedOptionIndex = 0;
    }
    onUpdate(dest.id, updated);
  };

  return (
    <div className="detailed-builder">
      <div className="sources-header">
        <h2>🎯 Destination Options</h2>
        <button className="btn-add" onClick={onAdd}>+ Add Destination</button>
      </div>
      <p className="subtitle">Add and configure Azure destinations to compare</p>

      {customDests.map((dest, index) => {
        const allTiers = getAllTiersForDestination(dest.destType);
        const currentTier = allTiers[dest.tierKey];
        const currentOptions = currentTier?.options || [];
        const selectedOption = currentOptions[dest.selectedOptionIndex] || currentOptions[0];
        const cost = customDestCosts[index];
        const savings = totalSourceMonthly > 0 && cost ? calculateSavings(totalSourceMonthly, cost.monthlyTotal) : null;
        const meta = DEST_TYPE_OPTIONS.find(d => d.value === dest.destType);
        const suggestion = suggestions?.[dest.destType];

        return (
          <div key={dest.id} className="card destination-builder-card">
            <div className="source-card-header">
              <h3>{meta?.icon} Destination #{index + 1}</h3>
              {customDests.length > 1 && (
                <button className="btn-remove" onClick={() => onRemove(dest.id)} title="Remove">✕</button>
              )}
            </div>

            {suggestion && (
              <div className="suggestion-badge">
                💡 Suggested for {meta?.label}: {suggestion.tierName} — {suggestion.reason}
              </div>
            )}

            <div className="form-group">
              <label>Optional Label</label>
              <input
                type="text"
                value={dest.label}
                onChange={e => handleChange(dest, 'label', e.target.value)}
                placeholder="e.g., Production DB, Analytics Cluster"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Azure Service</label>
                <select value={dest.destType} onChange={e => handleChange(dest, 'destType', e.target.value)}>
                  {DEST_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Service Tier</label>
                <select value={dest.tierKey} onChange={e => handleChange(dest, 'tierKey', e.target.value)}>
                  {Object.entries(allTiers).map(([key, tier]) => (
                    <option key={key} value={key}>{tier.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Compute Size</label>
                <select
                  value={dest.selectedOptionIndex}
                  onChange={e => handleChange(dest, 'selectedOptionIndex', parseInt(e.target.value))}
                >
                  {currentOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.vCores} vCores / {opt.ram}GB RAM — {formatCurrency(opt.payg)}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Pricing Term</label>
                <select value={dest.pricingTerm} onChange={e => handleChange(dest, 'pricingTerm', e.target.value)}>
                  {PRICING_TERMS.map(term => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={dest.useHybridBenefit}
                  onChange={e => handleChange(dest, 'useHybridBenefit', e.target.checked)}
                />
                Azure Hybrid Benefit (bring existing SQL license)
              </label>
            </div>

            {/* Inline cost result */}
            {cost && cost.monthlyTotal > 0 && (
              <div className={`dest-inline-cost ${savings && savings.amount > 0 ? 'saving' : 'more-expensive'}`}>
                <div className="inline-cost-row">
                  <span className="inline-cost-amount">{formatCurrency(cost.monthlyTotal)}/mo</span>
                  <span className="inline-cost-annual">({formatCurrency(cost.annualTotal)}/yr)</span>
                </div>
                {savings && totalSourceMonthly > 0 && (
                  <div className={`inline-savings ${savings.amount > 0 ? 'positive' : 'negative'}`}>
                    {savings.amount > 0
                      ? `✅ Save ${formatCurrency(savings.amount)}/mo (${savings.percentage.toFixed(1)}% vs source)`
                      : `📈 ${formatCurrency(Math.abs(savings.amount))}/mo more (${Math.abs(savings.percentage).toFixed(1)}% vs source)`
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Totals summary for custom destinations */}
      {customDestCosts.length > 0 && totalSourceMonthly > 0 && (
        <div className="card builder-totals">
          <h3>💰 Builder Summary</h3>
          <table className="summary-table">
            <thead>
              <tr><th>Item</th><th>Monthly</th><th>Annual</th></tr>
            </thead>
            <tbody>
              <tr className="source-row">
                <td><strong>Total Source Cost</strong></td>
                <td>{formatCurrency(totalSourceMonthly)}</td>
                <td>{formatCurrency(totalSourceMonthly * 12)}</td>
              </tr>
              {customDests.map((dest, idx) => {
                const cost = customDestCosts[idx];
                if (!cost || cost.monthlyTotal === 0) return null;
                const meta = DEST_TYPE_OPTIONS.find(d => d.value === dest.destType);
                return (
                  <tr key={dest.id}>
                    <td>{dest.label || `${meta?.label} #${idx + 1}`}</td>
                    <td>{formatCurrency(cost.monthlyTotal)}</td>
                    <td>{formatCurrency(cost.annualTotal)}</td>
                  </tr>
                );
              })}
              {(() => {
                const totalDest = customDestCosts.reduce((sum, c) => sum + (c?.monthlyTotal || 0), 0);
                const savings = calculateSavings(totalSourceMonthly, totalDest);
                return (
                  <tr style={{ fontWeight: 'bold', borderTop: '2px solid #0078d4' }}>
                    <td>Total Destinations</td>
                    <td>{formatCurrency(totalDest)}</td>
                    <td className={savings.amount > 0 ? 'positive' : 'negative'}>
                      {savings.amount > 0 ? `Save ${formatCurrency(savings.amount * 12)}/yr` : `+${formatCurrency(Math.abs(savings.amount * 12))}/yr`}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
