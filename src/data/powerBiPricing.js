// Power BI / Microsoft Fabric pricing (USD/month per user or capacity)
// Source: Microsoft Power BI pricing page
// Last updated: 2026-05-01

export const powerBiPricing = {
  lastUpdated: '2026-05-01',
  source: 'Microsoft Power BI Pricing Page',
  currency: 'USD',
  disclaimer: 'Prices are list prices. Enterprise agreements, M365 E5 bundles, and volume licensing may reduce costs. Fabric capacity pricing varies by region.',

  perUser: {
    pro: {
      name: 'Power BI Pro',
      monthlyPerUser: 10,
      annualPerUser: 120,
      description: 'Standard collaboration, sharing, and publishing. Included in M365 E5.',
      includedInM365E5: true,
      maxDatasetSizeGb: 1,
      refreshesPerDay: 8,
    },
    premiumPerUser: {
      name: 'Power BI Premium Per User (PPU)',
      monthlyPerUser: 20,
      annualPerUser: 240,
      description: 'Premium features including larger datasets, paginated reports, deployment pipelines, AI.',
      includedInM365E5: false,
      maxDatasetSizeGb: 100,
      refreshesPerDay: 48,
    },
  },

  capacity: {
    description: 'Fabric/Power BI capacity-based pricing (per capacity unit)',
    skus: [
      { name: 'F2', monthlyCost: 262, cus: 2, description: 'Dev/test workloads' },
      { name: 'F4', monthlyCost: 524, cus: 4, description: 'Small team workloads' },
      { name: 'F8', monthlyCost: 1049, cus: 8, description: 'Departmental workloads' },
      { name: 'F16', monthlyCost: 2098, cus: 16, description: 'Medium workloads' },
      { name: 'F32', monthlyCost: 4196, cus: 32, description: 'Large departmental' },
      { name: 'F64', monthlyCost: 8391, cus: 64, description: 'Enterprise workloads' },
      { name: 'F128', monthlyCost: 16783, cus: 128, description: 'Large enterprise' },
      { name: 'F256', monthlyCost: 33565, cus: 256, description: 'Mission-critical' },
    ],
    notes: 'Fabric capacity includes Power BI, Data Factory, Synapse, and more. Size based on concurrent workload.',
  },

  // Rough sizing guide: map Tableau usage to Power BI capacity
  sizingGuide: {
    // Viewers: ~50 concurrent viewers per F SKU CU
    viewersPerCu: 50,
    // Dashboards: ~10 active dashboards per CU
    dashboardsPerCu: 10,
    // Refreshes: ~2 scheduled refreshes per hour per CU
    refreshesPerHourPerCu: 2,
  },

  // Additional costs
  additionalCosts: {
    embeddedAnalytics: {
      name: 'Power BI Embedded',
      description: 'For embedding reports in custom apps (uses same F-SKU capacity)',
      included: true,
    },
    dataflows: {
      name: 'Dataflows (ETL)',
      description: 'Included in PPU and Fabric capacity',
      included: true,
    },
    paginatedReports: {
      name: 'Paginated Reports',
      description: 'Included in PPU and Fabric capacity',
      included: true,
    },
  },

  // Migration-specific Power BI costs
  migrationCosts: {
    powerBiGateway: {
      name: 'On-premises Data Gateway',
      description: 'Free software; runs on customer infrastructure',
      monthlyCost: 0,
      infrastructureCostEstimate: 500, // VM cost to run gateway
    },
    training: {
      perUserHours: 8,
      defaultHourlyRate: 175,
    },
  },
};
