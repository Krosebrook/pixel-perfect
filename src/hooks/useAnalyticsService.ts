/**
 * useAnalyticsService Hook
 * Integrates with AnalyticsService for analytics data
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { useMemo } from 'react';

const ANALYTICS_KEYS = {
  USAGE_STATS: 'usageStatistics',
  USAGE_BY_MODEL: 'usageByModel',
  USAGE_BY_DAY: 'usageByDay',
  COST_BREAKDOWN: 'costBreakdown',
  API_USAGE: 'apiUsage',
  LEADERBOARD: 'leaderboard',
} as const;

interface TimeRangeParams {
  startDate: Date;
  endDate: Date;
}

/**
 * Hook for fetching usage statistics
 */
export function useUsageStatistics(userId: string | undefined, timeRange: TimeRangeParams) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.USAGE_STATS, userId, timeRange.startDate.toISOString(), timeRange.endDate.toISOString()],
    queryFn: async () => {
      if (!userId) return null;
      const result = await analyticsService.getUsageStatistics(userId, timeRange);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch usage statistics');
      return result.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching usage breakdown by model
 */
export function useUsageByModel(userId: string | undefined, timeRange: TimeRangeParams) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.USAGE_BY_MODEL, userId, timeRange.startDate.toISOString(), timeRange.endDate.toISOString()],
    queryFn: async () => {
      if (!userId) return [];
      const result = await analyticsService.getUsageByModel(userId, timeRange);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch usage by model');
      return result.data ?? [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching usage breakdown by day
 */
export function useUsageByDay(userId: string | undefined, timeRange: TimeRangeParams) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.USAGE_BY_DAY, userId, timeRange.startDate.toISOString(), timeRange.endDate.toISOString()],
    queryFn: async () => {
      if (!userId) return [];
      const result = await analyticsService.getUsageByDay(userId, timeRange);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch usage by day');
      return result.data ?? [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching cost breakdown
 */
export function useCostBreakdown(userId: string | undefined, timeRange: TimeRangeParams) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.COST_BREAKDOWN, userId, timeRange.startDate.toISOString(), timeRange.endDate.toISOString()],
    queryFn: async () => {
      if (!userId) return [];
      const result = await analyticsService.getCostBreakdown(userId, timeRange);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch cost breakdown');
      return result.data ?? [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching API usage
 */
export function useApiEndpointUsage(userId: string | undefined, environmentMode: string) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.API_USAGE, userId, environmentMode],
    queryFn: async () => {
      if (!userId) return [];
      const result = await analyticsService.getApiUsage(userId, environmentMode);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch API usage');
      return result.data ?? [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent refresh for API usage
  });
}

/**
 * Hook for fetching model leaderboard
 */
export function useModelLeaderboard(timeRangeDays = 30, categoryFilter?: string) {
  return useQuery({
    queryKey: [ANALYTICS_KEYS.LEADERBOARD, timeRangeDays, categoryFilter],
    queryFn: async () => {
      const result = await analyticsService.getModelLeaderboard(timeRangeDays, categoryFilter);
      if (!result.success) throw new Error(result.error ?? 'Failed to fetch leaderboard');
      return result.data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Combined analytics hook for dashboard views
 */
export function useAnalyticsDashboard(userId: string | undefined, timeRange: TimeRangeParams) {
  const statsQuery = useUsageStatistics(userId, timeRange);
  const modelQuery = useUsageByModel(userId, timeRange);
  const dayQuery = useUsageByDay(userId, timeRange);
  const costQuery = useCostBreakdown(userId, timeRange);

  const isLoading = statsQuery.isLoading || modelQuery.isLoading || dayQuery.isLoading || costQuery.isLoading;
  const isError = statsQuery.isError || modelQuery.isError || dayQuery.isError || costQuery.isError;

  const data = useMemo(() => ({
    statistics: statsQuery.data,
    byModel: modelQuery.data ?? [],
    byDay: dayQuery.data ?? [],
    costBreakdown: costQuery.data ?? [],
  }), [statsQuery.data, modelQuery.data, dayQuery.data, costQuery.data]);

  return {
    data,
    isLoading,
    isError,
    refetch: () => {
      statsQuery.refetch();
      modelQuery.refetch();
      dayQuery.refetch();
      costQuery.refetch();
    },
  };
}

export default useUsageStatistics;
