import { useState, useEffect, useCallback } from 'react';
import SourceConfig from './components/SourceConfig.jsx';
import DestinationConfig from './components/DestinationConfig.jsx';
import ComparisonView from './components/ComparisonView.jsx';
import ExportPdf from './components/ExportPdf.jsx';
import SaveQuote from './components/SaveQuote.jsx';
import DetailedBuilder from './components/DetailedBuilder.jsx';
import ArchitectureUpload from './components/ArchitectureUpload.jsx';
import BiMigration from './components/BiMigration.jsx';
import { calculateSourceCost, calculateDestinationCost } from './utils/calculations.js';
import { suggestComputeTiers, getAllTiersForDestination } from './utils/suggestions.js';

let nextSourceId = 2;
let nextDestId = 1;

const createDefaultSource = (id) => ({
  id,
  sourceType: 'oracle',
  edition: 'enterprise',
  servers: 1,
  coresPerServer: 16,
  ramPerServer: 64,
  storageGbPerServer: 500,
  pricingTerm: 'onDemand',
  haRequired: false,
  customMonthlyCost: 0,
});

const DEST_TYPE_OPTIONS = [
  { value: 'azureSqlMi', label: 'Azure SQL Managed Instance' },
  { value: 'azureSqlDb', label: 'Azure SQL Database' },
  { value: 'sqlOnVm', label: 'SQL Server on Azure VM' },
];

const createDefaultCustomDest = (id, type = 'azureSqlMi') => ({
  id,
  destType: type,
  tierKey: 'generalPurpose',
  selectedOptionIndex: 0,
  pricingTerm: 'payg',
  useHybridBenefit: false,
  label: '',
});

const DEFAULT_SOURCES = [createDefaultSource(1)];

// Page 2 all-three comparison defaults
const DEFAULT_DESTINATIONS = {
  azureSqlMi: { tierKey: 'generalPurpose', selectedOptionIndex: 3, pricingTerm: 'payg', useHybridBenefit: false },
  azureSqlDb: { tierKey: 'generalPurpose', selectedOptionIndex: 4, pricingTerm: 'payg', useHybridBenefit: false },
  sqlOnVm: { tierKey: 'standard', selectedOptionIndex: 2, pricingTerm: 'payg', useHybridBenefit: false },
};

export default function App() {
  const [page, setPage] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [sources, setSources] = useState(DEFAULT_SOURCES);

  // Page 1: custom destination list (add/remove)
  const [customDests, setCustomDests] = useState([createDefaultCustomDest(nextDestId++)]);

  // Page 2: all-three quick view
  const [destinations, setDestinations] = useState(DEFAULT_DESTINATIONS);
  const [suggestions, setSuggestions] = useState(null);
  const [sourceCosts, setSourceCosts] = useState([]);
  const [destinationCosts, setDestinationCosts] = useState({});
  const [customDestCosts, setCustomDestCosts] = useState([]);

  // Source management
  const addSource = () => {
    const newSource = createDefaultSource(nextSourceId++);
    newSource.sourceType = '';
    setSources(prev => [...prev, newSource]);
  };

  const removeSource = (id) => {
    if (sources.length <= 1) return;
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const updateSource = useCallback((id, updatedConfig) => {
    setSources(prev => prev.map(s => s.id === id ? { ...updatedConfig, id } : s));
  }, []);

  // Custom destination management (Page 1)
  const addCustomDest = () => {
    setCustomDests(prev => [...prev, createDefaultCustomDest(nextDestId++, 'azureSqlMi')]);
  };

  const removeCustomDest = (id) => {
    if (customDests.length <= 1) return;
    setCustomDests(prev => prev.filter(d => d.id !== id));
  };

  const updateCustomDest = useCallback((id, updated) => {
    setCustomDests(prev => prev.map(d => d.id === id ? { ...updated, id } : d));
  }, []);

  // Recalculate suggestions based on aggregate sources
  useEffect(() => {
    const validSources = sources.filter(s => s.sourceType);
    if (validSources.length === 0) return;

    const totalCores = validSources.reduce((sum, s) => sum + (s.coresPerServer * s.servers), 0);
    const maxRam = Math.max(...validSources.map(s => s.ramPerServer));
    const totalStorage = validSources.reduce((sum, s) => sum + (s.storageGbPerServer * s.servers), 0);
    const anyHa = validSources.some(s => s.haRequired);

    const newSuggestions = suggestComputeTiers({
      cores: totalCores,
      ramGb: maxRam,
      storageGb: totalStorage,
      haRequired: anyHa,
    });
    setSuggestions(newSuggestions);

    // Auto-apply suggestions to page 2 destinations
    const updatedDest = { ...destinations };
    Object.entries(newSuggestions).forEach(([destKey, suggestion]) => {
      const allTiers = getAllTiersForDestination(destKey);
      const tierOptions = allTiers[suggestion.tierKey]?.options || [];
      const optionIndex = tierOptions.findIndex(opt => opt.vCores === suggestion.selected.vCores);
      updatedDest[destKey] = {
        ...updatedDest[destKey],
        tierKey: suggestion.tierKey,
        selectedOptionIndex: optionIndex >= 0 ? optionIndex : 0,
      };
    });
    setDestinations(updatedDest);
  }, [sources]);

  // Recalculate source costs
  useEffect(() => {
    const costs = sources.map(source => {
      if (!source.sourceType) return { id: source.id, monthlyTotal: 0, breakdown: [] };
      const cost = calculateSourceCost(source);
      return { ...cost, id: source.id, sourceType: source.sourceType };
    });
    setSourceCosts(costs);
  }, [sources]);

  // Recalculate Page 2 destination costs
  useEffect(() => {
    const validSources = sources.filter(s => s.sourceType);
    const totalServers = validSources.reduce((sum, s) => sum + s.servers, 0) || 1;
    const totalStorage = validSources.reduce((sum, s) => sum + (s.storageGbPerServer * s.servers), 0) || 500;

    const costs = {};
    Object.entries(destinations).forEach(([destKey, dest]) => {
      const allTiers = getAllTiersForDestination(destKey);
      const currentOptions = allTiers[dest.tierKey]?.options || [];
      const selectedOption = currentOptions[dest.selectedOptionIndex] || currentOptions[0];
      if (selectedOption) {
        costs[destKey] = calculateDestinationCost(
          destKey,
          dest.tierKey,
          selectedOption,
          totalStorage / totalServers,
          totalServers,
          dest.pricingTerm,
          dest.useHybridBenefit
        );
      }
    });
    setDestinationCosts(costs);
  }, [destinations, sources]);

  // Recalculate Page 1 custom destination costs
  useEffect(() => {
    const validSources = sources.filter(s => s.sourceType);
    const totalServers = validSources.reduce((sum, s) => sum + s.servers, 0) || 1;
    const totalStorage = validSources.reduce((sum, s) => sum + (s.storageGbPerServer * s.servers), 0) || 500;

    const costs = customDests.map(dest => {
      const allTiers = getAllTiersForDestination(dest.destType);
      const currentOptions = allTiers[dest.tierKey]?.options || [];
      const selectedOption = currentOptions[dest.selectedOptionIndex] || currentOptions[0];
      if (!selectedOption) return { id: dest.id, monthlyTotal: 0, breakdown: [] };
      const cost = calculateDestinationCost(
        dest.destType,
        dest.tierKey,
        selectedOption,
        totalStorage / totalServers,
        totalServers,
        dest.pricingTerm,
        dest.useHybridBenefit
      );
      return { ...cost, id: dest.id };
    });
    setCustomDestCosts(costs);
  }, [customDests, sources]);

  const handleDestinationChange = (destKey, updatedDest) => {
    setDestinations(prev => ({ ...prev, [destKey]: updatedDest }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔄 Azure Migration Cost Comparison</h1>
        <p>Compare costs of migrating databases and BI platforms to Microsoft</p>
        <div className="pricing-notice">
          ⚠️ All pricing is estimated based on public list prices. Actual costs may vary.
          <br />Last updated: May 2026 | Region: East US / us-east-1 / us-central1
        </div>
      </header>

      {/* Customer Name */}
      <div className="customer-bar card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Enter customer or project name"
            className="customer-input"
          />
        </div>
      </div>

      {/* Page Navigation */}
      <nav className="page-nav">
        <button className={`nav-btn ${page === 1 ? 'active' : ''}`} onClick={() => setPage(1)}>
          📋 Detailed Builder
        </button>
        <button className={`nav-btn ${page === 2 ? 'active' : ''}`} onClick={() => setPage(2)}>
          ⚡ Quick Compare (All 3)
        </button>
        <button className={`nav-btn ${page === 3 ? 'active' : ''}`} onClick={() => setPage(3)}>
          📊 BI Migration
        </button>
      </nav>

      <main className="app-main">
        {page === 1 && (
          <>
            <div className="config-panels">
              <div className="sources-panel">
                <div className="sources-header">
                  <h2>📊 Source Environments</h2>
                  <button className="btn-add" onClick={addSource}>+ Add Source</button>
                </div>
                <ArchitectureUpload onSourcesDetected={(detected) => {
                  const newSources = detected.map(d => ({
                    ...createDefaultSource(nextSourceId++),
                    ...d,
                  }));
                  setSources(prev => [...prev, ...newSources]);
                }} />
                {sources.map((source, index) => (
                  <SourceConfig
                    key={source.id}
                    config={source}
                    index={index}
                    canRemove={sources.length > 1}
                    onChange={(updated) => updateSource(source.id, updated)}
                    onRemove={() => removeSource(source.id)}
                  />
                ))}
              </div>
              <DetailedBuilder
                customDests={customDests}
                customDestCosts={customDestCosts}
                suggestions={suggestions}
                sourceCosts={sourceCosts}
                sources={sources}
                onAdd={addCustomDest}
                onRemove={removeCustomDest}
                onUpdate={updateCustomDest}
              />
            </div>
          </>
        )}

        {page === 2 && (
          <>
            <div className="config-panels">
              <div className="sources-panel">
                <div className="sources-header">
                  <h2>📊 Source Environments</h2>
                  <button className="btn-add" onClick={addSource}>+ Add Source</button>
                </div>
                <ArchitectureUpload onSourcesDetected={(detected) => {
                  const newSources = detected.map(d => ({
                    ...createDefaultSource(nextSourceId++),
                    ...d,
                  }));
                  setSources(prev => [...prev, ...newSources]);
                }} />
                {sources.map((source, index) => (
                  <SourceConfig
                    key={source.id}
                    config={source}
                    index={index}
                    canRemove={sources.length > 1}
                    onChange={(updated) => updateSource(source.id, updated)}
                    onRemove={() => removeSource(source.id)}
                  />
                ))}
              </div>
              <DestinationConfig
                destinations={destinations}
                suggestions={suggestions}
                onDestinationChange={handleDestinationChange}
              />
            </div>
            <ComparisonView
              sourceCosts={sourceCosts}
              destinationCosts={destinationCosts}
              sources={sources}
            />
          </>
        )}

        {page === 3 && <BiMigration />}

        <ExportPdf
          sources={sources}
          sourceCosts={sourceCosts}
          destinationCosts={destinationCosts}
          destinations={destinations}
          customDests={customDests}
          customDestCosts={customDestCosts}
          customerName={customerName}
        />
        <SaveQuote
          sources={sources}
          sourceCosts={sourceCosts}
          destinationCosts={destinationCosts}
          destinations={destinations}
          customDests={customDests}
          customDestCosts={customDestCosts}
          customerName={customerName}
        />
      </main>

      <footer className="app-footer">
        <p>Database Migration Cost Comparison Tool | Pricing data is for estimation purposes only</p>
        <p>Sources: Azure Retail Pricing, Oracle Technology Price List, AWS RDS Pricing, Google Cloud SQL Pricing</p>
      </footer>
    </div>
  );
}
