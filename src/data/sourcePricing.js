// Source system reference pricing (USD/year estimates)
// These are PUBLIC LIST PRICES and should be treated as estimates only.
// Actual customer costs vary significantly based on contracts, discounts, and editions.
// Users should override these with their actual costs.

// Oracle Database pricing
// Source: Oracle Technology Global Price List
// Last updated: 2026-05-01
export const oraclePricing = {
  lastUpdated: '2026-05-01',
  source: 'Oracle Technology Global Price List (public)',
  currency: 'USD',
  disclaimer: 'These are list prices. Actual costs depend on negotiated contracts, ULAs, and support agreements.',
  editions: {
    enterprise: {
      name: 'Enterprise Edition',
      licensePerCore: 47500, // per processor license (applies core factor)
      annualSupport: 10450, // 22% of license per year
      coreFactor: {
        intel: 0.5,
        amd: 0.5,
        sparc: 0.5,
        ibmPower: 1.0,
      },
    },
    standard: {
      name: 'Standard Edition 2',
      licensePerSocket: 17500, // per socket (up to 2 sockets)
      annualSupport: 3850, // 22% of license per year
    },
  },
  // Common add-on options (annual license + support)
  options: {
    rac: { name: 'Real Application Clusters', perCore: 23000, support: 5060 },
    partitioning: { name: 'Partitioning', perCore: 11500, support: 2530 },
    advancedSecurity: { name: 'Advanced Security', perCore: 15000, support: 3300 },
    diagnosticsPack: { name: 'Diagnostics Pack', perCore: 7500, support: 1650 },
    tuningPack: { name: 'Tuning Pack', perCore: 5000, support: 1100 },
  },
};

// AWS RDS pricing (USD/month, us-east-1)
// Source: https://aws.amazon.com/rds/pricing/
// Last updated: 2026-05-01
export const awsRdsPricing = {
  lastUpdated: '2026-05-01',
  region: 'us-east-1',
  source: 'AWS RDS Pricing Page',
  currency: 'USD',
  engines: {
    oracle: {
      name: 'RDS for Oracle (Enterprise)',
      instances: [
        { type: 'db.r6i.large', vCpus: 2, ram: 16, onDemandMonth: 1450, reserved1yr: 1015, reserved3yr: 725 },
        { type: 'db.r6i.xlarge', vCpus: 4, ram: 32, onDemandMonth: 2900, reserved1yr: 2030, reserved3yr: 1450 },
        { type: 'db.r6i.2xlarge', vCpus: 8, ram: 64, onDemandMonth: 5800, reserved1yr: 4060, reserved3yr: 2900 },
        { type: 'db.r6i.4xlarge', vCpus: 16, ram: 128, onDemandMonth: 11600, reserved1yr: 8120, reserved3yr: 5800 },
        { type: 'db.r6i.8xlarge', vCpus: 32, ram: 256, onDemandMonth: 23200, reserved1yr: 16240, reserved3yr: 11600 },
        { type: 'db.r6i.16xlarge', vCpus: 64, ram: 512, onDemandMonth: 46400, reserved1yr: 32480, reserved3yr: 23200 },
      ],
      storagePricePerGbMonth: 0.115,
    },
    postgresql: {
      name: 'RDS for PostgreSQL',
      instances: [
        { type: 'db.r6g.large', vCpus: 2, ram: 16, onDemandMonth: 175, reserved1yr: 122, reserved3yr: 88 },
        { type: 'db.r6g.xlarge', vCpus: 4, ram: 32, onDemandMonth: 350, reserved1yr: 245, reserved3yr: 175 },
        { type: 'db.r6g.2xlarge', vCpus: 8, ram: 64, onDemandMonth: 700, reserved1yr: 490, reserved3yr: 350 },
        { type: 'db.r6g.4xlarge', vCpus: 16, ram: 128, onDemandMonth: 1400, reserved1yr: 980, reserved3yr: 700 },
        { type: 'db.r6g.8xlarge', vCpus: 32, ram: 256, onDemandMonth: 2800, reserved1yr: 1960, reserved3yr: 1400 },
        { type: 'db.r6g.16xlarge', vCpus: 64, ram: 512, onDemandMonth: 5600, reserved1yr: 3920, reserved3yr: 2800 },
      ],
      storagePricePerGbMonth: 0.115,
    },
    mysql: {
      name: 'RDS for MySQL',
      instances: [
        { type: 'db.r6g.large', vCpus: 2, ram: 16, onDemandMonth: 168, reserved1yr: 118, reserved3yr: 84 },
        { type: 'db.r6g.xlarge', vCpus: 4, ram: 32, onDemandMonth: 336, reserved1yr: 235, reserved3yr: 168 },
        { type: 'db.r6g.2xlarge', vCpus: 8, ram: 64, onDemandMonth: 672, reserved1yr: 470, reserved3yr: 336 },
        { type: 'db.r6g.4xlarge', vCpus: 16, ram: 128, onDemandMonth: 1344, reserved1yr: 941, reserved3yr: 672 },
        { type: 'db.r6g.8xlarge', vCpus: 32, ram: 256, onDemandMonth: 2688, reserved1yr: 1882, reserved3yr: 1344 },
        { type: 'db.r6g.16xlarge', vCpus: 64, ram: 512, onDemandMonth: 5376, reserved1yr: 3763, reserved3yr: 2688 },
      ],
      storagePricePerGbMonth: 0.115,
    },
    aurora: {
      name: 'Amazon Aurora (PostgreSQL/MySQL compatible)',
      instances: [
        { type: 'db.r6g.large', vCpus: 2, ram: 16, onDemandMonth: 210, reserved1yr: 147, reserved3yr: 105 },
        { type: 'db.r6g.xlarge', vCpus: 4, ram: 32, onDemandMonth: 420, reserved1yr: 294, reserved3yr: 210 },
        { type: 'db.r6g.2xlarge', vCpus: 8, ram: 64, onDemandMonth: 840, reserved1yr: 588, reserved3yr: 420 },
        { type: 'db.r6g.4xlarge', vCpus: 16, ram: 128, onDemandMonth: 1680, reserved1yr: 1176, reserved3yr: 840 },
        { type: 'db.r6g.8xlarge', vCpus: 32, ram: 256, onDemandMonth: 3360, reserved1yr: 2352, reserved3yr: 1680 },
        { type: 'db.r6g.16xlarge', vCpus: 64, ram: 512, onDemandMonth: 6720, reserved1yr: 4704, reserved3yr: 3360 },
      ],
      storagePricePerGbMonth: 0.10,
    },
  },
};

// Google Cloud SQL pricing (USD/month, us-central1)
// Source: https://cloud.google.com/sql/pricing
// Last updated: 2026-05-01
export const gcpCloudSqlPricing = {
  lastUpdated: '2026-05-01',
  region: 'us-central1',
  source: 'Google Cloud SQL Pricing Page',
  currency: 'USD',
  engines: {
    postgresql: {
      name: 'Cloud SQL for PostgreSQL',
      instances: [
        { type: 'db-custom-2-8192', vCpus: 2, ram: 8, onDemandMonth: 130, cud1yr: 91, cud3yr: 65 },
        { type: 'db-custom-4-16384', vCpus: 4, ram: 16, onDemandMonth: 260, cud1yr: 182, cud3yr: 130 },
        { type: 'db-custom-8-32768', vCpus: 8, ram: 32, onDemandMonth: 520, cud1yr: 364, cud3yr: 260 },
        { type: 'db-custom-16-65536', vCpus: 16, ram: 64, onDemandMonth: 1040, cud1yr: 728, cud3yr: 520 },
        { type: 'db-custom-32-131072', vCpus: 32, ram: 128, onDemandMonth: 2080, cud1yr: 1456, cud3yr: 1040 },
        { type: 'db-custom-64-262144', vCpus: 64, ram: 256, onDemandMonth: 4160, cud1yr: 2912, cud3yr: 2080 },
        { type: 'db-custom-96-393216', vCpus: 96, ram: 384, onDemandMonth: 6240, cud1yr: 4368, cud3yr: 3120 },
      ],
      storagePricePerGbMonth: 0.170, // SSD
    },
    mysql: {
      name: 'Cloud SQL for MySQL',
      instances: [
        { type: 'db-custom-2-8192', vCpus: 2, ram: 8, onDemandMonth: 125, cud1yr: 88, cud3yr: 63 },
        { type: 'db-custom-4-16384', vCpus: 4, ram: 16, onDemandMonth: 250, cud1yr: 175, cud3yr: 125 },
        { type: 'db-custom-8-32768', vCpus: 8, ram: 32, onDemandMonth: 500, cud1yr: 350, cud3yr: 250 },
        { type: 'db-custom-16-65536', vCpus: 16, ram: 64, onDemandMonth: 1000, cud1yr: 700, cud3yr: 500 },
        { type: 'db-custom-32-131072', vCpus: 32, ram: 128, onDemandMonth: 2000, cud1yr: 1400, cud3yr: 1000 },
        { type: 'db-custom-64-262144', vCpus: 64, ram: 256, onDemandMonth: 4000, cud1yr: 2800, cud3yr: 2000 },
        { type: 'db-custom-96-393216', vCpus: 96, ram: 384, onDemandMonth: 6000, cud1yr: 4200, cud3yr: 3000 },
      ],
      storagePricePerGbMonth: 0.170,
    },
    sqlServer: {
      name: 'Cloud SQL for SQL Server',
      instances: [
        { type: 'db-custom-2-8192', vCpus: 2, ram: 8, onDemandMonth: 285, cud1yr: 200, cud3yr: 143 },
        { type: 'db-custom-4-16384', vCpus: 4, ram: 16, onDemandMonth: 570, cud1yr: 399, cud3yr: 285 },
        { type: 'db-custom-8-32768', vCpus: 8, ram: 32, onDemandMonth: 1140, cud1yr: 798, cud3yr: 570 },
        { type: 'db-custom-16-65536', vCpus: 16, ram: 64, onDemandMonth: 2280, cud1yr: 1596, cud3yr: 1140 },
        { type: 'db-custom-32-131072', vCpus: 32, ram: 128, onDemandMonth: 4560, cud1yr: 3192, cud3yr: 2280 },
      ],
      storagePricePerGbMonth: 0.170,
    },
  },
};

// IBM Db2 pricing (estimates, USD/year)
// Source: IBM price lists (varies heavily by contract)
// Last updated: 2026-05-01
export const ibmDb2Pricing = {
  lastUpdated: '2026-05-01',
  source: 'IBM Passport Advantage (estimated)',
  currency: 'USD',
  disclaimer: 'IBM pricing is highly contract-specific. These are rough list price estimates.',
  editions: {
    enterprise: {
      name: 'Db2 Advanced Enterprise Server Edition',
      pvu: 100, // processor value units per core (Intel)
      annualLicensePerPvu: 215,
      annualSupportPercent: 0.20, // 20% of license
    },
    standard: {
      name: 'Db2 Standard Edition',
      perSocket: 9900, // annual per socket
      annualSupportPercent: 0.20,
    },
  },
};

// On-premises PostgreSQL / MySQL (open source) cost model
export const openSourcePricing = {
  lastUpdated: '2026-05-01',
  source: 'Estimated operational costs',
  currency: 'USD',
  disclaimer: 'Open source DBs have no license cost but have operational overhead.',
  postgresql: {
    name: 'PostgreSQL (self-hosted)',
    licenseCost: 0,
    estimatedDbaHoursPerServerMonth: 10,
    estimatedDbaHourlyRate: 85,
    hardwareCostPerCoreMonth: 45, // amortized server hardware
    hardwareCostPerGbRamMonth: 5,
  },
  mysql: {
    name: 'MySQL Community (self-hosted)',
    licenseCost: 0,
    estimatedDbaHoursPerServerMonth: 8,
    estimatedDbaHourlyRate: 75,
    hardwareCostPerCoreMonth: 45,
    hardwareCostPerGbRamMonth: 5,
  },
};
