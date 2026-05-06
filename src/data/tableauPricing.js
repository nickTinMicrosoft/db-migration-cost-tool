// Tableau pricing (USD/year per user, list prices)
// Source: Tableau public pricing page
// Last updated: 2026-05-01

export const tableauPricing = {
  lastUpdated: '2026-05-01',
  source: 'Tableau Public Pricing Page (list prices)',
  currency: 'USD',
  disclaimer: 'Actual costs vary by contract, volume discounts, and deployment model. Users should override with actual costs.',

  server: {
    name: 'Tableau Server (Self-Hosted)',
    description: 'On-premises deployment requiring customer-managed infrastructure',
    userRoles: {
      creator: {
        name: 'Creator',
        annualPerUser: 840,
        description: 'Full authoring, data prep, explore capabilities',
      },
      explorer: {
        name: 'Explorer',
        annualPerUser: 504,
        description: 'Self-service exploration of published data sources',
      },
      viewer: {
        name: 'Viewer',
        annualPerUser: 180,
        description: 'View and interact with published content',
      },
    },
    infrastructure: {
      description: 'Estimated infrastructure cost for self-hosted Tableau Server',
      estimatedServerCostPerMonth: 2500, // typical VM/hardware for small-medium deployment
      estimatedDbaHoursPerMonth: 20,
      estimatedDbaHourlyRate: 100,
      estimatedStorageCostPerGbMonth: 0.10,
    },
  },

  online: {
    name: 'Tableau Cloud (Online)',
    description: 'Salesforce-hosted SaaS deployment',
    userRoles: {
      creator: {
        name: 'Creator',
        annualPerUser: 840,
        description: 'Full authoring, data prep, explore capabilities',
      },
      explorer: {
        name: 'Explorer',
        annualPerUser: 504,
        description: 'Self-service exploration of published data sources',
      },
      viewer: {
        name: 'Viewer',
        annualPerUser: 180,
        description: 'View and interact with published content',
      },
    },
    // No infrastructure costs for Online
    infrastructure: null,
  },

  // Migration effort estimation factors
  migrationEffort: {
    perWorkbook: {
      low: 4,    // hours for simple workbook conversion
      medium: 12, // hours for moderate complexity
      high: 24,   // hours for complex workbooks with custom SQL, LOD calcs, etc.
    },
    perDataSource: {
      low: 2,
      medium: 6,
      high: 16,
    },
    perExtract: {
      low: 1,
      medium: 3,
      high: 8,
    },
    trainingPerUser: 4, // hours of training per user
    defaultHourlyRate: 175, // consulting/implementation rate
    testingMultiplier: 0.3, // 30% additional time for testing/validation
  },
};
