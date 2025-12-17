/**
 * @fileoverview Central export point for all custom hooks.
 * Import hooks from this file for cleaner imports throughout the application.
 * 
 * @example
 * import { useDeploymentData, useProfile, useBudget } from '@/hooks';
 */

// Core UI hooks
export { useToast, toast } from './use-toast';
export { useIsMobile } from './use-mobile';

// User data hooks
export { useProfile } from './useProfile';
export { useBudget } from './useBudget';
export { useApiUsage } from './useApiUsage';
export { useRateLimitConfig, useRateLimitUsage } from './useRateLimits';

// Analytics hooks
export { useAnalyticsSummary, useDailySpending, useCostByEndpoint, useHourlyDistribution } from './useAnalytics';

// Deployment metrics hooks
export {
  useDeploymentStatistics,
  useRecentDeployments,
  useRecentIncidents,
  useDeploymentTrend,
  useDeploymentRealtimeUpdates,
  useDeploymentData,
  type DeploymentTrendData,
} from './useDeploymentMetrics';

// Deployment budget hooks
export {
  useDeploymentBudgets,
  useDeploymentAlerts,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useAcknowledgeAlert,
  useComparePeriods,
} from './useDeploymentBudget';
