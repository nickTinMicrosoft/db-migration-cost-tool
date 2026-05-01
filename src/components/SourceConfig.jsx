import { useState } from 'react';

const SOURCE_TYPES = [
  { value: 'oracle', label: 'Oracle Database', category: 'On-Premises' },
  { value: 'ibm-db2', label: 'IBM Db2', category: 'On-Premises' },
  { value: 'postgresql-self', label: 'PostgreSQL (self-hosted)', category: 'On-Premises' },
  { value: 'mysql-self', label: 'MySQL (self-hosted)', category: 'On-Premises' },
  { value: 'aws-rds-oracle', label: 'AWS RDS for Oracle', category: 'AWS' },
  { value: 'aws-rds-postgresql', label: 'AWS RDS for PostgreSQL', category: 'AWS' },
  { value: 'aws-rds-mysql', label: 'AWS RDS for MySQL', category: 'AWS' },
  { value: 'aws-aurora', label: 'Amazon Aurora', category: 'AWS' },
  { value: 'gcp-postgresql', label: 'Google Cloud SQL for PostgreSQL', category: 'Google Cloud' },
  { value: 'gcp-mysql', label: 'Google Cloud SQL for MySQL', category: 'Google Cloud' },
  { value: 'gcp-sqlserver', label: 'Google Cloud SQL for SQL Server', category: 'Google Cloud' },
];

const EDITIONS = {
  oracle: [{ value: 'enterprise', label: 'Enterprise Edition' }, { value: 'standard', label: 'Standard Edition 2' }],
  'ibm-db2': [{ value: 'enterprise', label: 'Advanced Enterprise' }, { value: 'standard', label: 'Standard' }],
};

const PRICING_TERMS = {
  oracle: [{ value: 'onDemand', label: 'List Price (amortized)' }],
  'ibm-db2': [{ value: 'onDemand', label: 'List Price (amortized)' }],
  'postgresql-self': [{ value: 'onDemand', label: 'Operational Cost' }],
  'mysql-self': [{ value: 'onDemand', label: 'Operational Cost' }],
  'aws-rds-oracle': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'reserved1yr', label: '1-Year Reserved' }, { value: 'reserved3yr', label: '3-Year Reserved' }],
  'aws-rds-postgresql': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'reserved1yr', label: '1-Year Reserved' }, { value: 'reserved3yr', label: '3-Year Reserved' }],
  'aws-rds-mysql': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'reserved1yr', label: '1-Year Reserved' }, { value: 'reserved3yr', label: '3-Year Reserved' }],
  'aws-aurora': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'reserved1yr', label: '1-Year Reserved' }, { value: 'reserved3yr', label: '3-Year Reserved' }],
  'gcp-postgresql': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'cud1yr', label: '1-Year CUD' }, { value: 'cud3yr', label: '3-Year CUD' }],
  'gcp-mysql': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'cud1yr', label: '1-Year CUD' }, { value: 'cud3yr', label: '3-Year CUD' }],
  'gcp-sqlserver': [{ value: 'onDemand', label: 'On-Demand' }, { value: 'cud1yr', label: '1-Year CUD' }, { value: 'cud3yr', label: '3-Year CUD' }],
};

export default function SourceConfig({ config, index, canRemove, onChange, onRemove }) {
  const [useCustomCost, setUseCustomCost] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const groupedSources = SOURCE_TYPES.reduce((acc, src) => {
    if (!acc[src.category]) acc[src.category] = [];
    acc[src.category].push(src);
    return acc;
  }, {});

  const sourceLabel = SOURCE_TYPES.find(s => s.value === config.sourceType)?.label || 'New Source';

  return (
    <div className="source-config card">
      <div className="source-card-header">
        <h3>#{index + 1} — {sourceLabel}</h3>
        {canRemove && (
          <button className="btn-remove" onClick={onRemove} title="Remove this source">✕</button>
        )}
      </div>

      <div className="form-group">
        <label>Source Database System</label>
        <select value={config.sourceType} onChange={e => handleChange('sourceType', e.target.value)}>
          <option value="">-- Select Source --</option>
          {Object.entries(groupedSources).map(([category, sources]) => (
            <optgroup key={category} label={category}>
              {sources.map(src => (
                <option key={src.value} value={src.value}>{src.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {EDITIONS[config.sourceType] && (
        <div className="form-group">
          <label>Edition</label>
          <select value={config.edition} onChange={e => handleChange('edition', e.target.value)}>
            {EDITIONS[config.sourceType].map(ed => (
              <option key={ed.value} value={ed.value}>{ed.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Number of Servers</label>
          <input type="number" min="1" value={config.servers} onChange={e => handleChange('servers', parseInt(e.target.value) || 1)} />
        </div>
        <div className="form-group">
          <label>Cores per Server</label>
          <input type="number" min="1" value={config.coresPerServer} onChange={e => handleChange('coresPerServer', parseInt(e.target.value) || 1)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>RAM per Server (GB)</label>
          <input type="number" min="1" value={config.ramPerServer} onChange={e => handleChange('ramPerServer', parseInt(e.target.value) || 1)} />
        </div>
        <div className="form-group">
          <label>Storage per Server (GB)</label>
          <input type="number" min="1" value={config.storageGbPerServer} onChange={e => handleChange('storageGbPerServer', parseInt(e.target.value) || 100)} />
        </div>
      </div>

      {PRICING_TERMS[config.sourceType] && PRICING_TERMS[config.sourceType].length > 1 && (
        <div className="form-group">
          <label>Current Pricing Term</label>
          <select value={config.pricingTerm} onChange={e => handleChange('pricingTerm', e.target.value)}>
            {PRICING_TERMS[config.sourceType].map(term => (
              <option key={term.value} value={term.value}>{term.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group checkbox-group">
        <label>
          <input type="checkbox" checked={config.haRequired} onChange={e => handleChange('haRequired', e.target.checked)} />
          High Availability / DR Required
        </label>
      </div>

      <div className="cost-override">
        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" checked={useCustomCost} onChange={e => setUseCustomCost(e.target.checked)} />
            Override with actual monthly cost
          </label>
        </div>
        {useCustomCost && (
          <div className="form-group">
            <label>Actual Monthly Cost (USD)</label>
            <input
              type="number"
              min="0"
              value={config.customMonthlyCost || ''}
              onChange={e => handleChange('customMonthlyCost', parseFloat(e.target.value) || 0)}
              placeholder="Enter your actual monthly cost"
            />
            <small className="hint">This overrides the estimated cost calculation</small>
          </div>
        )}
      </div>
    </div>
  );
}
