import { tableauPricing } from '../data/tableauPricing.js';
import { powerBiPricing } from '../data/powerBiPricing.js';

export function calculateBiMigration(config) {
  const {
    tableauDeployment, creators, explorers, viewers, workbooks,
    dataSources, extracts, complexity, powerBiLicense,
    hasM365E5, selectedCapacitySku, hourlyRate,
    useCustomTableauCost, customTableauMonthlyCost,
  } = config;

  const tp = tableauPricing[tableauDeployment];
  const totalUsers = creators + explorers + viewers;

  // Current Tableau cost (annual)
  let tableauAnnualCost;
  if (useCustomTableauCost) {
    tableauAnnualCost = customTableauMonthlyCost * 12;
  } else {
    const licenseCost =
      (creators * tp.userRoles.creator.annualPerUser) +
      (explorers * tp.userRoles.explorer.annualPerUser) +
      (viewers * tp.userRoles.viewer.annualPerUser);

    let infraCost = 0;
    if (tp.infrastructure) {
      infraCost = (tp.infrastructure.estimatedServerCostPerMonth +
        (tp.infrastructure.estimatedDbaHoursPerMonth * tp.infrastructure.estimatedDbaHourlyRate)) * 12;
    }
    tableauAnnualCost = licenseCost + infraCost;
  }
  const tableauMonthlyCost = tableauAnnualCost / 12;

  // Power BI cost (annual)
  let powerBiAnnualCost = 0;
  let powerBiBreakdown = [];

  if (powerBiLicense === 'capacity') {
    const sku = powerBiPricing.capacity.skus[selectedCapacitySku];
    powerBiAnnualCost = sku.monthlyCost * 12;
    powerBiBreakdown.push({ label: `Fabric ${sku.name} Capacity`, annual: powerBiAnnualCost });
  } else {
    const tier = powerBiPricing.perUser[powerBiLicense];
    const licensedUsers = hasM365E5 && powerBiLicense === 'pro' ? 0 : totalUsers;
    powerBiAnnualCost = licensedUsers * tier.annualPerUser;
    if (hasM365E5 && powerBiLicense === 'pro') {
      powerBiBreakdown.push({ label: 'Power BI Pro (included in M365 E5)', annual: 0 });
    } else {
      powerBiBreakdown.push({ label: `${tier.name} × ${totalUsers} users`, annual: powerBiAnnualCost });
    }
  }

  // On-prem gateway cost
  if (tableauDeployment === 'server') {
    const gatewayCost = powerBiPricing.migrationCosts.powerBiGateway.infrastructureCostEstimate * 12;
    powerBiAnnualCost += gatewayCost;
    powerBiBreakdown.push({ label: 'On-premises Data Gateway (VM)', annual: gatewayCost });
  }

  const powerBiMonthlyCost = powerBiAnnualCost / 12;

  // Migration effort
  const effort = tableauPricing.migrationEffort;
  const workbookHours = workbooks * effort.perWorkbook[complexity];
  const dataSourceHours = dataSources * effort.perDataSource[complexity];
  const extractHours = extracts * effort.perExtract[complexity];
  const trainingHours = totalUsers * effort.trainingPerUser;
  const subtotalHours = workbookHours + dataSourceHours + extractHours + trainingHours;
  const testingHours = subtotalHours * effort.testingMultiplier;
  const totalMigrationHours = subtotalHours + testingHours;
  const migrationCost = totalMigrationHours * hourlyRate;

  // Savings
  const annualSavings = tableauAnnualCost - powerBiAnnualCost;
  const monthlySavings = annualSavings / 12;
  const paybackMonths = annualSavings > 0 ? Math.ceil(migrationCost / (annualSavings / 12)) : null;

  return {
    tableauMonthlyCost,
    tableauAnnualCost,
    powerBiMonthlyCost,
    powerBiAnnualCost,
    powerBiBreakdown,
    annualSavings,
    monthlySavings,
    savingsPercent: tableauAnnualCost > 0 ? ((annualSavings / tableauAnnualCost) * 100).toFixed(1) : 0,
    migration: {
      workbookHours,
      dataSourceHours,
      extractHours,
      trainingHours,
      testingHours,
      totalHours: totalMigrationHours,
      totalCost: migrationCost,
    },
    paybackMonths,
    totalUsers,
  };
}
