// Azure SQL Managed Instance pricing (USD/month, East US region)
// Source: https://azure.microsoft.com/pricing/details/azure-sql-managed-instance/
// Last updated: 2026-05-01
export const azureSqlMi = {
  lastUpdated: '2026-05-01',
  region: 'East US',
  currency: 'USD',
  source: 'Azure Retail Pricing',
  tiers: {
    generalPurpose: {
      name: 'General Purpose',
      description: 'Budget-friendly, balanced compute and storage',
      computeGeneration: 'Standard-series (Gen5)',
      options: [
        { vCores: 4, ram: 20.4, storageMaxGb: 8192, payg: 730, reserved1yr: 493, reserved3yr: 365, licenseIncluded: true },
        { vCores: 8, ram: 40.8, storageMaxGb: 8192, payg: 1460, reserved1yr: 986, reserved3yr: 730, licenseIncluded: true },
        { vCores: 16, ram: 81.6, storageMaxGb: 8192, payg: 2920, reserved1yr: 1972, reserved3yr: 1460, licenseIncluded: true },
        { vCores: 24, ram: 122.4, storageMaxGb: 8192, payg: 4380, reserved1yr: 2958, reserved3yr: 2190, licenseIncluded: true },
        { vCores: 32, ram: 163.2, storageMaxGb: 8192, payg: 5840, reserved1yr: 3944, reserved3yr: 2920, licenseIncluded: true },
        { vCores: 40, ram: 204.0, storageMaxGb: 8192, payg: 7300, reserved1yr: 4930, reserved3yr: 3650, licenseIncluded: true },
        { vCores: 64, ram: 326.4, storageMaxGb: 16384, payg: 11680, reserved1yr: 7888, reserved3yr: 5840, licenseIncluded: true },
        { vCores: 80, ram: 408.0, storageMaxGb: 16384, payg: 14600, reserved1yr: 9860, reserved3yr: 7300, licenseIncluded: true },
      ],
      storagePricePerGbMonth: 0.115,
      backupPricePerGbMonth: 0.095,
    },
    businessCritical: {
      name: 'Business Critical',
      description: 'High performance, built-in HA with read replicas',
      computeGeneration: 'Standard-series (Gen5)',
      options: [
        { vCores: 4, ram: 20.4, storageMaxGb: 4096, payg: 1752, reserved1yr: 1183, reserved3yr: 876, licenseIncluded: true },
        { vCores: 8, ram: 40.8, storageMaxGb: 4096, payg: 3504, reserved1yr: 2366, reserved3yr: 1752, licenseIncluded: true },
        { vCores: 16, ram: 81.6, storageMaxGb: 4096, payg: 7008, reserved1yr: 4733, reserved3yr: 3504, licenseIncluded: true },
        { vCores: 24, ram: 122.4, storageMaxGb: 4096, payg: 10512, reserved1yr: 7099, reserved3yr: 5256, licenseIncluded: true },
        { vCores: 32, ram: 163.2, storageMaxGb: 4096, payg: 14016, reserved1yr: 9466, reserved3yr: 7008, licenseIncluded: true },
        { vCores: 40, ram: 204.0, storageMaxGb: 4096, payg: 17520, reserved1yr: 11832, reserved3yr: 8760, licenseIncluded: true },
        { vCores: 64, ram: 326.4, storageMaxGb: 4096, payg: 28032, reserved1yr: 18931, reserved3yr: 14016, licenseIncluded: true },
        { vCores: 80, ram: 408.0, storageMaxGb: 4096, payg: 35040, reserved1yr: 23664, reserved3yr: 17520, licenseIncluded: true },
      ],
      storagePricePerGbMonth: 0.25,
      backupPricePerGbMonth: 0.095,
    },
  },
  hybridBenefitDiscount: 0.55, // ~55% discount when bringing own SQL license
};

// Azure SQL Database pricing (USD/month, East US region)
// Source: https://azure.microsoft.com/pricing/details/azure-sql-database/
// Last updated: 2026-05-01
export const azureSqlDb = {
  lastUpdated: '2026-05-01',
  region: 'East US',
  currency: 'USD',
  source: 'Azure Retail Pricing',
  tiers: {
    generalPurpose: {
      name: 'General Purpose',
      description: 'Provisioned compute, scalable storage',
      options: [
        { vCores: 2, ram: 10.2, storageMaxGb: 4096, payg: 370, reserved1yr: 250, reserved3yr: 185 },
        { vCores: 4, ram: 20.4, storageMaxGb: 4096, payg: 740, reserved1yr: 500, reserved3yr: 370 },
        { vCores: 6, ram: 30.6, storageMaxGb: 4096, payg: 1110, reserved1yr: 750, reserved3yr: 555 },
        { vCores: 8, ram: 40.8, storageMaxGb: 4096, payg: 1480, reserved1yr: 1000, reserved3yr: 740 },
        { vCores: 16, ram: 81.6, storageMaxGb: 4096, payg: 2960, reserved1yr: 2000, reserved3yr: 1480 },
        { vCores: 24, ram: 122.4, storageMaxGb: 4096, payg: 4440, reserved1yr: 3000, reserved3yr: 2220 },
        { vCores: 32, ram: 163.2, storageMaxGb: 4096, payg: 5920, reserved1yr: 4000, reserved3yr: 2960 },
        { vCores: 40, ram: 204.0, storageMaxGb: 4096, payg: 7400, reserved1yr: 5000, reserved3yr: 3700 },
        { vCores: 80, ram: 408.0, storageMaxGb: 4096, payg: 14800, reserved1yr: 10000, reserved3yr: 7400 },
        { vCores: 128, ram: 625.0, storageMaxGb: 4096, payg: 23680, reserved1yr: 16000, reserved3yr: 11840 },
      ],
      storagePricePerGbMonth: 0.115,
    },
    businessCritical: {
      name: 'Business Critical',
      description: 'High IOPS, built-in HA, read replicas',
      options: [
        { vCores: 2, ram: 10.2, storageMaxGb: 4096, payg: 888, reserved1yr: 600, reserved3yr: 444 },
        { vCores: 4, ram: 20.4, storageMaxGb: 4096, payg: 1776, reserved1yr: 1200, reserved3yr: 888 },
        { vCores: 8, ram: 40.8, storageMaxGb: 4096, payg: 3552, reserved1yr: 2400, reserved3yr: 1776 },
        { vCores: 16, ram: 81.6, storageMaxGb: 4096, payg: 7104, reserved1yr: 4800, reserved3yr: 3552 },
        { vCores: 32, ram: 163.2, storageMaxGb: 4096, payg: 14208, reserved1yr: 9600, reserved3yr: 7104 },
        { vCores: 64, ram: 326.4, storageMaxGb: 4096, payg: 28416, reserved1yr: 19200, reserved3yr: 14208 },
        { vCores: 80, ram: 408.0, storageMaxGb: 4096, payg: 35520, reserved1yr: 24000, reserved3yr: 17760 },
        { vCores: 128, ram: 625.0, storageMaxGb: 4096, payg: 56832, reserved1yr: 38400, reserved3yr: 28416 },
      ],
      storagePricePerGbMonth: 0.25,
    },
    hyperscale: {
      name: 'Hyperscale',
      description: 'Rapidly scalable, up to 100TB, instant backups',
      options: [
        { vCores: 2, ram: 10.2, storageMaxGb: 102400, payg: 408, reserved1yr: 276, reserved3yr: 204 },
        { vCores: 4, ram: 20.4, storageMaxGb: 102400, payg: 816, reserved1yr: 551, reserved3yr: 408 },
        { vCores: 8, ram: 40.8, storageMaxGb: 102400, payg: 1632, reserved1yr: 1102, reserved3yr: 816 },
        { vCores: 16, ram: 81.6, storageMaxGb: 102400, payg: 3264, reserved1yr: 2205, reserved3yr: 1632 },
        { vCores: 24, ram: 122.4, storageMaxGb: 102400, payg: 4896, reserved1yr: 3307, reserved3yr: 2448 },
        { vCores: 32, ram: 163.2, storageMaxGb: 102400, payg: 6528, reserved1yr: 4410, reserved3yr: 3264 },
        { vCores: 64, ram: 326.4, storageMaxGb: 102400, payg: 13056, reserved1yr: 8819, reserved3yr: 6528 },
        { vCores: 80, ram: 408.0, storageMaxGb: 102400, payg: 16320, reserved1yr: 11024, reserved3yr: 8160 },
      ],
      storagePricePerGbMonth: 0.25,
    },
  },
  hybridBenefitDiscount: 0.55,
};

// SQL Server on Azure VM pricing (USD/month, East US region)
// Source: https://azure.microsoft.com/pricing/details/virtual-machines/sql-server/
// Last updated: 2026-05-01
export const sqlOnVm = {
  lastUpdated: '2026-05-01',
  region: 'East US',
  currency: 'USD',
  source: 'Azure Retail Pricing',
  tiers: {
    standard: {
      name: 'Standard (D-series VMs)',
      description: 'General purpose VMs with SQL Server Standard',
      options: [
        { vmSize: 'D4s_v5', vCores: 4, ram: 16, payg: 706, reserved1yr: 520, reserved3yr: 380, sqlEdition: 'Standard' },
        { vmSize: 'D8s_v5', vCores: 8, ram: 32, payg: 1412, reserved1yr: 1040, reserved3yr: 760, sqlEdition: 'Standard' },
        { vmSize: 'D16s_v5', vCores: 16, ram: 64, payg: 2824, reserved1yr: 2080, reserved3yr: 1520, sqlEdition: 'Standard' },
        { vmSize: 'D32s_v5', vCores: 32, ram: 128, payg: 5648, reserved1yr: 4160, reserved3yr: 3040, sqlEdition: 'Standard' },
        { vmSize: 'D48s_v5', vCores: 48, ram: 192, payg: 8472, reserved1yr: 6240, reserved3yr: 4560, sqlEdition: 'Standard' },
        { vmSize: 'D64s_v5', vCores: 64, ram: 256, payg: 11296, reserved1yr: 8320, reserved3yr: 6080, sqlEdition: 'Standard' },
      ],
    },
    enterprise: {
      name: 'Enterprise (E-series VMs)',
      description: 'Memory-optimized VMs with SQL Server Enterprise',
      options: [
        { vmSize: 'E4s_v5', vCores: 4, ram: 32, payg: 1560, reserved1yr: 1150, reserved3yr: 845, sqlEdition: 'Enterprise' },
        { vmSize: 'E8s_v5', vCores: 8, ram: 64, payg: 3120, reserved1yr: 2300, reserved3yr: 1690, sqlEdition: 'Enterprise' },
        { vmSize: 'E16s_v5', vCores: 16, ram: 128, payg: 6240, reserved1yr: 4600, reserved3yr: 3380, sqlEdition: 'Enterprise' },
        { vmSize: 'E32s_v5', vCores: 32, ram: 256, payg: 12480, reserved1yr: 9200, reserved3yr: 6760, sqlEdition: 'Enterprise' },
        { vmSize: 'E48s_v5', vCores: 48, ram: 384, payg: 18720, reserved1yr: 13800, reserved3yr: 10140, sqlEdition: 'Enterprise' },
        { vmSize: 'E64s_v5', vCores: 64, ram: 512, payg: 24960, reserved1yr: 18400, reserved3yr: 13520, sqlEdition: 'Enterprise' },
        { vmSize: 'E96s_v5', vCores: 96, ram: 672, payg: 37440, reserved1yr: 27600, reserved3yr: 20280, sqlEdition: 'Enterprise' },
      ],
    },
  },
  managedDiskPricePerGbMonth: 0.12, // Premium SSD average
  hybridBenefitDiscount: 0.40, // discount when bringing own SQL + Windows licenses
};
