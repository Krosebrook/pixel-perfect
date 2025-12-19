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

// Utility hooks (NEW)
export { useAsync } from './useAsync';
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { usePagination, type UsePaginationOptions, type UsePaginationReturn } from './usePagination';
export { useFocusTrap, useArrowNavigation } from './useFocusTrap';
export { useLocalStorage } from './useLocalStorage';
export { useClipboard } from './useClipboard';
export { 
  useMediaQuery, 
  useIsTablet, 
  useIsDesktop, 
  usePrefersReducedMotion, 
  usePrefersDarkMode 
} from './useMediaQuery';

// User data hooks
export { useProfile } from './useProfile';
export { useBudget } from './useBudget';
export { useApiUsage } from './useApiUsage';
export { useRateLimitConfig, useRateLimitUsage } from './useRateLimits';

// Prompt hooks (NEW - integrated with service layer)
export {
  usePrompts,
  usePromptDetail,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  useCreatePromptVersion,
  useRollbackPromptVersion,
  useForkPrompt,
} from './usePrompts';

// Analytics hooks (legacy)
export { useAnalyticsSummary, useDailySpending, useCostByEndpoint, useHourlyDistribution } from './useAnalytics';

// Analytics hooks (NEW - integrated with service layer)
export {
  useUsageStatistics,
  useUsageByModel,
  useUsageByDay,
  useCostBreakdown,
  useApiEndpointUsage,
  useModelLeaderboard,
  useAnalyticsDashboard,
} from './useAnalyticsService';

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
