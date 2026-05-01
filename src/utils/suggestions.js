import { azureSqlMi, azureSqlDb, sqlOnVm } from '../data/azurePricing.js';

/**
 * Suggests the best-fit Azure compute tier based on source server specs.
 * Returns suggestions for each destination type with reasoning.
 */
export function suggestComputeTiers(sourceSpec) {
  const { cores, ramGb, storageGb, haRequired } = sourceSpec;

  return {
    azureSqlMi: suggestMiTier(cores, ramGb, storageGb, haRequired),
    azureSqlDb: suggestDbTier(cores, ramGb, storageGb, haRequired),
    sqlOnVm: suggestVmTier(cores, ramGb, storageGb, haRequired),
  };
}

function suggestMiTier(cores, ramGb, storageGb, haRequired) {
  const tierKey = haRequired ? 'businessCritical' : 'generalPurpose';
  const tier = azureSqlMi.tiers[tierKey];
  const options = tier.options;

  // Find smallest option that meets or exceeds requirements
  const match = options.find(opt => opt.vCores >= cores && opt.ram >= ramGb);
  const selected = match || options[options.length - 1];

  return {
    destination: 'Azure SQL Managed Instance',
    tierName: tier.name,
    tierKey,
    selected,
    reason: match
      ? `${selected.vCores} vCores / ${selected.ram}GB RAM meets ${cores} cores / ${ramGb}GB RAM requirement`
      : `Maximum tier selected - source exceeds available options (${cores} cores / ${ramGb}GB RAM)`,
    allOptions: options,
    storageCost: storageGb * tier.storagePricePerGbMonth,
  };
}

function suggestDbTier(cores, ramGb, storageGb, haRequired) {
  // For large workloads suggest hyperscale, for HA suggest business critical
  let tierKey;
  if (storageGb > 4096) {
    tierKey = 'hyperscale';
  } else if (haRequired) {
    tierKey = 'businessCritical';
  } else {
    tierKey = 'generalPurpose';
  }

  const tier = azureSqlDb.tiers[tierKey];
  const options = tier.options;

  const match = options.find(opt => opt.vCores >= cores && opt.ram >= ramGb);
  const selected = match || options[options.length - 1];

  return {
    destination: 'Azure SQL Database',
    tierName: tier.name,
    tierKey,
    selected,
    reason: match
      ? `${selected.vCores} vCores / ${selected.ram}GB RAM meets requirements`
      : `Maximum tier selected - source exceeds available options`,
    allOptions: options,
    storageCost: storageGb * tier.storagePricePerGbMonth,
  };
}

function suggestVmTier(cores, ramGb, storageGb, haRequired) {
  // Use E-series (memory-optimized) if RAM-heavy, otherwise D-series
  const ramPerCore = ramGb / cores;
  const tierKey = ramPerCore >= 6 ? 'enterprise' : 'standard';
  const tier = sqlOnVm.tiers[tierKey];
  const options = tier.options;

  const match = options.find(opt => opt.vCores >= cores && opt.ram >= ramGb);
  const selected = match || options[options.length - 1];

  return {
    destination: 'SQL Server on Azure VM',
    tierName: tier.name,
    tierKey,
    selected,
    reason: match
      ? `${selected.vmSize} (${selected.vCores} vCores / ${selected.ram}GB RAM) meets requirements`
      : `Maximum tier selected - source exceeds available options`,
    allOptions: options,
    storageCost: storageGb * sqlOnVm.managedDiskPricePerGbMonth,
  };
}

/**
 * Get all available tiers for a destination type (for the customization dropdown)
 */
export function getAllTiersForDestination(destinationType) {
  switch (destinationType) {
    case 'azureSqlMi':
      return {
        generalPurpose: { name: 'General Purpose', options: azureSqlMi.tiers.generalPurpose.options },
        businessCritical: { name: 'Business Critical', options: azureSqlMi.tiers.businessCritical.options },
      };
    case 'azureSqlDb':
      return {
        generalPurpose: { name: 'General Purpose', options: azureSqlDb.tiers.generalPurpose.options },
        businessCritical: { name: 'Business Critical', options: azureSqlDb.tiers.businessCritical.options },
        hyperscale: { name: 'Hyperscale', options: azureSqlDb.tiers.hyperscale.options },
      };
    case 'sqlOnVm':
      return {
        standard: { name: 'Standard (D-series)', options: sqlOnVm.tiers.standard.options },
        enterprise: { name: 'Enterprise (E-series)', options: sqlOnVm.tiers.enterprise.options },
      };
    default:
      return {};
  }
}
