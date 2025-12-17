/**
 * Centralized React Query keys for consistent cache management
 * Using factory pattern for type-safe, invalidation-friendly keys
 */

export const queryKeys = {
  // Deployment metrics
  deployments: {
    all: ['deployments'] as const,
    statistics: (daysBack: number = 30) => [...queryKeys.deployments.all, 'statistics', daysBack] as const,
    recent: (limit: number = 10) => [...queryKeys.deployments.all, 'recent', limit] as const,
    trend: (days: number = 30) => [...queryKeys.deployments.all, 'trend', days] as const,
    single: (id: string) => [...queryKeys.deployments.all, id] as const,
  },

  // Incidents
  incidents: {
    all: ['incidents'] as const,
    recent: (limit: number = 10) => [...queryKeys.incidents.all, 'recent', limit] as const,
    single: (id: string) => [...queryKeys.incidents.all, id] as const,
  },

  // Deployment budgets
  budgets: {
    all: ['deployment-budgets'] as const,
    alerts: ['deployment-alerts'] as const,
    comparison: (period1Start: string, period1End: string, period2Start: string, period2End: string) =>
      ['deployment-comparison', period1Start, period1End, period2Start, period2End] as const,
  },

  // Changelogs
  changelogs: {
    all: ['deployment-changelogs'] as const,
    single: (id: string) => [...queryKeys.changelogs.all, id] as const,
  },

  // Prompts
  prompts: {
    all: ['prompts'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.prompts.all, 'list', filters] as const,
    single: (id: string) => [...queryKeys.prompts.all, id] as const,
    versions: (promptId: string) => [...queryKeys.prompts.all, promptId, 'versions'] as const,
  },

  // Test runs
  testRuns: {
    all: ['test-runs'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.testRuns.all, 'list', filters] as const,
    single: (id: string) => [...queryKeys.testRuns.all, id] as const,
  },

  // User data
  user: {
    profile: ['user-profile'] as const,
    budget: ['user-budget'] as const,
    apiUsage: (timeRange: string, mode: string) => ['api-usage', timeRange, mode] as const,
    rateLimits: (mode: string) => ['rate-limits', mode] as const,
  },

  // Leaderboard
  leaderboard: (days: number = 30, category?: string) => ['leaderboard', days, category] as const,
} as const;

export type QueryKeys = typeof queryKeys;
