/**
 * @fileoverview Centralized React Query keys for consistent cache management.
 * Uses factory pattern for type-safe, invalidation-friendly keys.
 * 
 * @example
 * // Using query keys in a hook
 * const { data } = useQuery({
 *   queryKey: queryKeys.deployments.recent(10),
 *   queryFn: fetchRecentDeployments,
 * });
 * 
 * @example
 * // Invalidating related queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
 */

/**
 * Query key factory for all application queries.
 * Organized by domain with hierarchical keys for granular cache invalidation.
 */
export const queryKeys = {
  /**
   * Deployment metrics query keys.
   * @property {readonly string[]} all - Base key for all deployment queries
   */
  deployments: {
    /** Base key for all deployment queries - use for broad invalidation */
    all: ['deployments'] as const,
    /**
     * Key for deployment statistics aggregate data
     * @param daysBack - Number of days to look back (default: 30)
     */
    statistics: (daysBack: number = 30) => [...queryKeys.deployments.all, 'statistics', daysBack] as const,
    /**
     * Key for recent deployments list
     * @param limit - Maximum number of deployments to fetch (default: 10)
     */
    recent: (limit: number = 10) => [...queryKeys.deployments.all, 'recent', limit] as const,
    /**
     * Key for deployment trend data grouped by day
     * @param days - Number of days for trend analysis (default: 30)
     */
    trend: (days: number = 30) => [...queryKeys.deployments.all, 'trend', days] as const,
    /**
     * Key for a single deployment by ID
     * @param id - The deployment's unique identifier
     */
    single: (id: string) => [...queryKeys.deployments.all, id] as const,
  },

  /**
   * Incident query keys for deployment-related incidents.
   */
  incidents: {
    /** Base key for all incident queries */
    all: ['incidents'] as const,
    /**
     * Key for recent incidents list
     * @param limit - Maximum number of incidents to fetch (default: 10)
     */
    recent: (limit: number = 10) => [...queryKeys.incidents.all, 'recent', limit] as const,
    /**
     * Key for a single incident by ID
     * @param id - The incident's unique identifier
     */
    single: (id: string) => [...queryKeys.incidents.all, id] as const,
  },

  /**
   * Deployment budget and alert query keys.
   */
  budgets: {
    /** Key for all deployment budgets */
    all: ['deployment-budgets'] as const,
    /** Key for deployment alerts */
    alerts: ['deployment-alerts'] as const,
    /**
     * Key for period comparison data
     * @param period1Start - Start date for baseline period
     * @param period1End - End date for baseline period
     * @param period2Start - Start date for comparison period
     * @param period2End - End date for comparison period
     */
    comparison: (period1Start: string, period1End: string, period2Start: string, period2End: string) =>
      ['deployment-comparison', period1Start, period1End, period2Start, period2End] as const,
  },

  /**
   * Changelog query keys for deployment release notes.
   */
  changelogs: {
    /** Key for all changelogs */
    all: ['deployment-changelogs'] as const,
    /**
     * Key for a single changelog by ID
     * @param id - The changelog's unique identifier
     */
    single: (id: string) => [...queryKeys.changelogs.all, id] as const,
  },

  /**
   * Prompt-related query keys.
   */
  prompts: {
    /** Base key for all prompt queries */
    all: ['prompts'] as const,
    /**
     * Key for filtered prompt list
     * @param filters - Optional filter criteria
     */
    list: (filters?: Record<string, unknown>) => [...queryKeys.prompts.all, 'list', filters] as const,
    /**
     * Key for a single prompt by ID
     * @param id - The prompt's unique identifier
     */
    single: (id: string) => [...queryKeys.prompts.all, id] as const,
    /**
     * Key for prompt version history
     * @param promptId - The parent prompt's ID
     */
    versions: (promptId: string) => [...queryKeys.prompts.all, promptId, 'versions'] as const,
  },

  /**
   * Test run query keys for model comparison tests.
   */
  testRuns: {
    /** Base key for all test run queries */
    all: ['test-runs'] as const,
    /**
     * Key for filtered test run list
     * @param filters - Optional filter criteria
     */
    list: (filters?: Record<string, unknown>) => [...queryKeys.testRuns.all, 'list', filters] as const,
    /**
     * Key for a single test run by ID
     * @param id - The test run's unique identifier
     */
    single: (id: string) => [...queryKeys.testRuns.all, id] as const,
  },

  /**
   * User-specific data query keys.
   */
  user: {
    /** Key for user profile data */
    profile: ['user-profile'] as const,
    /** Key for user budget settings */
    budget: ['user-budget'] as const,
    /**
     * Key for API usage statistics
     * @param timeRange - Time range for usage data (e.g., '24h', '7d')
     * @param mode - Environment mode ('sandbox' | 'production')
     */
    apiUsage: (timeRange: string, mode: string) => ['api-usage', timeRange, mode] as const,
    /**
     * Key for rate limit status
     * @param mode - Environment mode ('sandbox' | 'production')
     */
    rateLimits: (mode: string) => ['rate-limits', mode] as const,
  },

  /**
   * Model leaderboard query key
   * @param days - Number of days for leaderboard data (default: 30)
   * @param category - Optional category filter
   */
  leaderboard: (days: number = 30, category?: string) => ['leaderboard', days, category] as const,
} as const;

/** Type representing all query keys in the application */
export type QueryKeys = typeof queryKeys;
