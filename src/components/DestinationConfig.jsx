import { getAllTiersForDestination } from '../utils/suggestions.js';
import { formatCurrency } from '../utils/calculations.js';

export default function DestinationConfig({ destinations, suggestions, onDestinationChange }) {
  const DEST_LABELS = {
    azureSqlMi: { name: 'Azure SQL Managed Instance', icon: '🔷' },
    azureSqlDb: { name: 'Azure SQL Database', icon: '🔶' },
    sqlOnVm: { name: 'SQL Server on Azure VM', icon: '💻' },
  };

  const PRICING_TERMS = [
    { value: 'payg', label: 'Pay-as-you-go' },
    { value: 'reserved1yr', label: '1-Year Reserved' },
    { value: 'reserved3yr', label: '3-Year Reserved' },
  ];

  const handleChange = (destKey, field, value) => {
    const updated = { ...destinations[destKey], [field]: value };

    // If tier changes, reset selected option to first of that tier
    if (field === 'tierKey') {
      const allTiers = getAllTiersForDestination(destKey);
      const newTier = allTiers[value];
      if (newTier && newTier.options.length > 0) {
        updated.selectedOptionIndex = 0;
      }
    }

    onDestinationChange(destKey, updated);
  };

  return (
    <div className="destination-config card">
      <h2>🎯 Destination Options</h2>
      <p className="subtitle">Microsoft SQL destinations — customize compute for each</p>

      {Object.entries(DEST_LABELS).map(([destKey, meta]) => {
        const dest = destinations[destKey];
        const suggestion = suggestions?.[destKey];
        const allTiers = getAllTiersForDestination(destKey);
        const currentTier = allTiers[dest.tierKey];
        const currentOptions = currentTier?.options || [];
        const selectedOption = currentOptions[dest.selectedOptionIndex] || currentOptions[0];

        return (
          <div key={destKey} className="destination-card">
            <h3>{meta.icon} {meta.name}</h3>

            {suggestion && (
              <div className="suggestion-badge">
                💡 Suggested: {suggestion.tierName} — {suggestion.reason}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Service Tier</label>
                <select value={dest.tierKey} onChange={e => handleChange(destKey, 'tierKey', e.target.value)}>
                  {Object.entries(allTiers).map(([key, tier]) => (
                    <option key={key} value={key}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Compute Size</label>
                <select
                  value={dest.selectedOptionIndex}
                  onChange={e => handleChange(destKey, 'selectedOptionIndex', parseInt(e.target.value))}
                >
                  {currentOptions.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.vCores} vCores / {opt.ram}GB RAM — {formatCurrency(opt.payg)}/mo
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Pricing Term</label>
                <select value={dest.pricingTerm} onChange={e => handleChange(destKey, 'pricingTerm', e.target.value)}>
                  {PRICING_TERMS.map(term => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group" style={{ alignSelf: 'flex-end' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={dest.useHybridBenefit}
                    onChange={e => handleChange(destKey, 'useHybridBenefit', e.target.checked)}
                  />
                  Azure Hybrid Benefit
                </label>
                <small className="hint">Bring existing SQL Server license</small>
              </div>
            </div>

            {selectedOption && (
              <div className="selected-spec">
                <span><strong>Selected:</strong> {selectedOption.vCores} vCores, {selectedOption.ram}GB RAM</span>
                {selectedOption.vmSize && <span> | VM: {selectedOption.vmSize}</span>}
                {selectedOption.storageMaxGb && <span> | Max Storage: {selectedOption.storageMaxGb.toLocaleString()}GB</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
