import { oraclePricing, awsRdsPricing, gcpCloudSqlPricing, ibmDb2Pricing, openSourcePricing } from '../data/sourcePricing.js';
import { azureSqlMi, azureSqlDb, sqlOnVm } from '../data/azurePricing.js';

/**
 * Calculate estimated monthly cost for a source database system
 */
export function calculateSourceCost(sourceConfig) {
  const { sourceType, servers, coresPerServer, ramPerServer, storageGbPerServer, edition, pricingTerm } = sourceConfig;

  switch (sourceType) {
    case 'oracle':
      return calculateOracleCost(servers, coresPerServer, edition);
    case 'aws-rds-oracle':
      return calculateAwsRdsCost('oracle', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'aws-rds-postgresql':
      return calculateAwsRdsCost('postgresql', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'aws-rds-mysql':
      return calculateAwsRdsCost('mysql', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'aws-aurora':
      return calculateAwsRdsCost('aurora', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'gcp-postgresql':
      return calculateGcpCost('postgresql', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'gcp-mysql':
      return calculateGcpCost('mysql', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'gcp-sqlserver':
      return calculateGcpCost('sqlServer', servers, coresPerServer, ramPerServer, storageGbPerServer, pricingTerm);
    case 'ibm-db2':
      return calculateDb2Cost(servers, coresPerServer, edition);
    case 'postgresql-self':
      return calculateOpenSourceCost('postgresql', servers, coresPerServer, ramPerServer, storageGbPerServer);
    case 'mysql-self':
      return calculateOpenSourceCost('mysql', servers, coresPerServer, ramPerServer, storageGbPerServer);
    default:
      return { monthlyTotal: 0, breakdown: [], disclaimer: 'Unknown source type' };
  }
}

function calculateOracleCost(servers, cores, edition = 'enterprise') {
  const ed = oraclePricing.editions[edition];
  if (!ed) return { monthlyTotal: 0, breakdown: [], disclaimer: 'Invalid edition' };

  if (edition === 'enterprise') {
    const effectiveCores = cores * ed.coreFactor.intel;
    const licenseCostPerServer = effectiveCores * ed.licensePerCore;
    const annualSupportPerServer = effectiveCores * ed.annualSupport;
    const totalAnnual = (licenseCostPerServer * 0 + annualSupportPerServer) * servers; // License is one-time, support is annual
    // For comparison we amortize license over 5 years + annual support
    const amortizedAnnual = ((licenseCostPerServer / 5) + annualSupportPerServer) * servers;
    const monthly = amortizedAnnual / 12;

    return {
      monthlyTotal: monthly,
      annualTotal: amortizedAnnual,
      breakdown: [
        { item: 'License (amortized 5yr)', annual: (licenseCostPerServer / 5) * servers },
        { item: 'Annual Support (22%)', annual: annualSupportPerServer * servers },
      ],
      disclaimer: oraclePricing.disclaimer,
      details: `${servers} servers × ${cores} cores (factor ${ed.coreFactor.intel}) = ${effectiveCores * servers} effective processor licenses`,
    };
  } else {
    // Standard Edition 2 - per socket
    const sockets = Math.ceil(cores / 8); // SE2 limited to 2 sockets
    const licenseCostPerServer = sockets * ed.licensePerSocket;
    const annualSupportPerServer = sockets * ed.annualSupport;
    const amortizedAnnual = ((licenseCostPerServer / 5) + annualSupportPerServer) * servers;
    const monthly = amortizedAnnual / 12;

    return {
      monthlyTotal: monthly,
      annualTotal: amortizedAnnual,
      breakdown: [
        { item: 'License (amortized 5yr)', annual: (licenseCostPerServer / 5) * servers },
        { item: 'Annual Support (22%)', annual: annualSupportPerServer * servers },
      ],
      disclaimer: oraclePricing.disclaimer,
      details: `${servers} servers × ${sockets} sockets`,
    };
  }
}

function calculateAwsRdsCost(engine, servers, cores, ram, storageGb, pricingTerm = 'onDemand') {
  const engineData = awsRdsPricing.engines[engine];
  if (!engineData) return { monthlyTotal: 0, breakdown: [], disclaimer: 'Unknown engine' };

  // Find best matching instance
  const instance = engineData.instances.find(i => i.vCpus >= cores && i.ram >= ram)
    || engineData.instances[engineData.instances.length - 1];

  let computeMonthly;
  switch (pricingTerm) {
    case 'reserved1yr': computeMonthly = instance.reserved1yr; break;
    case 'reserved3yr': computeMonthly = instance.reserved3yr; break;
    default: computeMonthly = instance.onDemandMonth;
  }

  const storageMonthly = storageGb * engineData.storagePricePerGbMonth;
  const totalMonthly = (computeMonthly + storageMonthly) * servers;

  return {
    monthlyTotal: totalMonthly,
    annualTotal: totalMonthly * 12,
    breakdown: [
      { item: `Compute (${instance.type} × ${servers})`, monthly: computeMonthly * servers },
      { item: `Storage (${storageGb}GB × ${servers})`, monthly: storageMonthly * servers },
    ],
    disclaimer: `Based on ${pricingTerm === 'onDemand' ? 'On-Demand' : pricingTerm} pricing`,
    details: `${servers} × ${instance.type} (${instance.vCpus} vCPUs, ${instance.ram}GB RAM)`,
  };
}

function calculateGcpCost(engine, servers, cores, ram, storageGb, pricingTerm = 'onDemand') {
  const engineData = gcpCloudSqlPricing.engines[engine];
  if (!engineData) return { monthlyTotal: 0, breakdown: [], disclaimer: 'Unknown engine' };

  const instance = engineData.instances.find(i => i.vCpus >= cores && i.ram >= ram)
    || engineData.instances[engineData.instances.length - 1];

  let computeMonthly;
  switch (pricingTerm) {
    case 'cud1yr': computeMonthly = instance.cud1yr; break;
    case 'cud3yr': computeMonthly = instance.cud3yr; break;
    default: computeMonthly = instance.onDemandMonth;
  }

  const storageMonthly = storageGb * engineData.storagePricePerGbMonth;
  const totalMonthly = (computeMonthly + storageMonthly) * servers;

  return {
    monthlyTotal: totalMonthly,
    annualTotal: totalMonthly * 12,
    breakdown: [
      { item: `Compute (${instance.type} × ${servers})`, monthly: computeMonthly * servers },
      { item: `Storage (${storageGb}GB × ${servers})`, monthly: storageMonthly * servers },
    ],
    disclaimer: `Based on ${pricingTerm === 'onDemand' ? 'On-Demand' : pricingTerm} pricing`,
    details: `${servers} × ${instance.type} (${instance.vCpus} vCPUs, ${instance.ram}GB RAM)`,
  };
}

function calculateDb2Cost(servers, cores, edition = 'enterprise') {
  const ed = ibmDb2Pricing.editions[edition];
  if (!ed) return { monthlyTotal: 0, breakdown: [], disclaimer: 'Invalid edition' };

  if (edition === 'enterprise') {
    const pvuPerServer = cores * ed.pvu;
    const annualLicensePerServer = pvuPerServer * ed.annualLicensePerPvu;
    const annualSupportPerServer = annualLicensePerServer * ed.annualSupportPercent;
    const amortizedAnnual = ((annualLicensePerServer / 5) + annualSupportPerServer) * servers;
    const monthly = amortizedAnnual / 12;

    return {
      monthlyTotal: monthly,
      annualTotal: amortizedAnnual,
      breakdown: [
        { item: 'License (amortized 5yr)', annual: (annualLicensePerServer / 5) * servers },
        { item: 'Annual Support (20%)', annual: annualSupportPerServer * servers },
      ],
      disclaimer: ibmDb2Pricing.disclaimer,
      details: `${servers} servers × ${cores} cores × ${ed.pvu} PVU = ${pvuPerServer * servers} total PVUs`,
    };
  } else {
    const annualPerServer = ed.perSocket * Math.ceil(cores / 8);
    const annualSupportPerServer = annualPerServer * ed.annualSupportPercent;
    const total = (annualPerServer + annualSupportPerServer) * servers;
    const monthly = total / 12;

    return {
      monthlyTotal: monthly,
      annualTotal: total,
      breakdown: [
        { item: 'License', annual: annualPerServer * servers },
        { item: 'Support (20%)', annual: annualSupportPerServer * servers },
      ],
      disclaimer: ibmDb2Pricing.disclaimer,
    };
  }
}

function calculateOpenSourceCost(engine, servers, cores, ram, storageGb) {
  const pricing = openSourcePricing[engine];
  if (!pricing) return { monthlyTotal: 0, breakdown: [], disclaimer: 'Unknown engine' };

  const dbaMonthly = pricing.estimatedDbaHoursPerServerMonth * pricing.estimatedDbaHourlyRate * servers;
  const hardwareMonthly = ((cores * pricing.hardwareCostPerCoreMonth) + (ram * pricing.hardwareCostPerGbRamMonth)) * servers;
  const totalMonthly = dbaMonthly + hardwareMonthly;

  return {
    monthlyTotal: totalMonthly,
    annualTotal: totalMonthly * 12,
    breakdown: [
      { item: `DBA Labor (${pricing.estimatedDbaHoursPerServerMonth}hrs × $${pricing.estimatedDbaHourlyRate}/hr × ${servers})`, monthly: dbaMonthly },
      { item: `Hardware (amortized)`, monthly: hardwareMonthly },
    ],
    disclaimer: openSourcePricing.disclaimer,
    details: `${servers} servers, no license costs`,
  };
}

/**
 * Calculate destination monthly cost for a selected tier
 */
export function calculateDestinationCost(destinationType, tierKey, selectedOption, storageGb, servers, pricingTerm = 'payg', useHybridBenefit = false) {
  let computeMonthly, storageCostPerGb, hybridDiscount;

  switch (destinationType) {
    case 'azureSqlMi': {
      const tier = azureSqlMi.tiers[tierKey];
      storageCostPerGb = tier.storagePricePerGbMonth;
      hybridDiscount = useHybridBenefit ? azureSqlMi.hybridBenefitDiscount : 0;
      switch (pricingTerm) {
        case 'reserved1yr': computeMonthly = selectedOption.reserved1yr; break;
        case 'reserved3yr': computeMonthly = selectedOption.reserved3yr; break;
        default: computeMonthly = selectedOption.payg;
      }
      break;
    }
    case 'azureSqlDb': {
      const tier = azureSqlDb.tiers[tierKey];
      storageCostPerGb = tier.storagePricePerGbMonth;
      hybridDiscount = useHybridBenefit ? azureSqlDb.hybridBenefitDiscount : 0;
      switch (pricingTerm) {
        case 'reserved1yr': computeMonthly = selectedOption.reserved1yr; break;
        case 'reserved3yr': computeMonthly = selectedOption.reserved3yr; break;
        default: computeMonthly = selectedOption.payg;
      }
      break;
    }
    case 'sqlOnVm': {
      storageCostPerGb = sqlOnVm.managedDiskPricePerGbMonth;
      hybridDiscount = useHybridBenefit ? sqlOnVm.hybridBenefitDiscount : 0;
      switch (pricingTerm) {
        case 'reserved1yr': computeMonthly = selectedOption.reserved1yr; break;
        case 'reserved3yr': computeMonthly = selectedOption.reserved3yr; break;
        default: computeMonthly = selectedOption.payg;
      }
      break;
    }
    default:
      return { monthlyTotal: 0, breakdown: [] };
  }

  const computeAfterDiscount = computeMonthly * (1 - hybridDiscount);
  const storageMonthly = storageGb * storageCostPerGb;
  // For MI and SQL DB, consolidation possible - use servers as multiplier for now
  const totalMonthly = (computeAfterDiscount + storageMonthly) * servers;

  return {
    monthlyTotal: totalMonthly,
    annualTotal: totalMonthly * 12,
    breakdown: [
      { item: `Compute (${selectedOption.vCores} vCores)${useHybridBenefit ? ' w/ Hybrid Benefit' : ''}`, monthly: computeAfterDiscount * servers },
      { item: `Storage (${storageGb}GB × ${servers})`, monthly: storageMonthly * servers },
    ],
    pricingTerm,
    hybridBenefitApplied: useHybridBenefit,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Calculate savings percentage
 */
export function calculateSavings(sourceCost, destCost) {
  if (sourceCost === 0) return { amount: 0, percentage: 0 };
  const amount = sourceCost - destCost;
  const percentage = (amount / sourceCost) * 100;
  return { amount, percentage };
}
