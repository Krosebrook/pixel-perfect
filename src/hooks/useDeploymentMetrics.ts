/**
 * @fileoverview Hooks for fetching and managing deployment metrics data.
 * Provides real-time updates via Supabase subscriptions and efficient
 * cache management using React Query.
 * 
 * @example
 * // Using the combined hook for all deployment data
 * const { statistics, recentDeployments, isLoading } = useDeploymentData({ daysBack: 30 });
 * 
 * @example
 * // Using individual hooks for specific data
 * const { data: stats } = useDeploymentStatistics(30);
 * const { data: deployments } = useRecentDeployments(10);
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { DeploymentMetric, DeploymentIncident } from '@/types/deployment';

/**
 * Fetches aggregated deployment statistics from the database.
 * 
 * @param daysBack - Number of days to include in statistics (default: 30)
 * @returns React Query result with deployment statistics
 * 
 * @example
 * const { data: stats, isLoading } = useDeploymentStatistics(30);
 * console.log(stats?.success_rate, stats?.total_deployments);
 */
export function useDeploymentStatistics(daysBack: number = 30) {
  return useQuery({
    queryKey: queryKeys.deployments.statistics(daysBack),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_deployment_statistics', { days_back: daysBack });
      if (error) throw error;
      return data[0];
    },
  });
}

/**
 * Fetches a list of recent production deployments.
 * 
 * @param limit - Maximum number of deployments to fetch (default: 10)
 * @returns React Query result with array of DeploymentMetric
 * 
 * @example
 * const { data: deployments } = useRecentDeployments(5);
 * deployments?.forEach(d => console.log(d.commit_sha, d.status));
 */
export function useRecentDeployments(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.deployments.recent(limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_metrics')
        .select('*')
        .eq('deployment_type', 'production')
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DeploymentMetric[];
    },
  });
}

/**
 * Fetches recent deployment incidents with associated deployment info.
 * 
 * @param limit - Maximum number of incidents to fetch (default: 10)
 * @returns React Query result with array of DeploymentIncident
 * 
 * @example
 * const { data: incidents } = useRecentIncidents(10);
 * incidents?.filter(i => !i.resolved_at).forEach(i => console.log(i.incident_type));
 */
export function useRecentIncidents(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.incidents.recent(limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_incidents')
        .select('*, deployment_metrics(*)')
        .order('detected_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DeploymentIncident[];
    },
  });
}

/**
 * Data structure for deployment trend chart visualization.
 */
export interface DeploymentTrendData {
  /** Date string in ISO format (YYYY-MM-DD) */
  date: string;
  /** Count of successful deployments */
  success: number;
  /** Count of failed deployments */
  failed: number;
  /** Count of rolled back deployments */
  rolled_back: number;
}

/**
 * Fetches deployment trend data grouped by day for chart visualization.
 * 
 * @param days - Number of days to include in trend (default: 30)
 * @returns React Query result with array of DeploymentTrendData
 * 
 * @example
 * const { data: trend } = useDeploymentTrend(30);
 * // Use with recharts: <LineChart data={trend} />
 */
export function useDeploymentTrend(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.deployments.trend(days),
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('deployment_metrics')
        .select('started_at, status')
        .eq('deployment_type', 'production')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Group deployments by date
      const grouped = data.reduce<Record<string, DeploymentTrendData>>((acc, deployment) => {
        const date = new Date(deployment.started_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, success: 0, failed: 0, rolled_back: 0 };
        }
        const status = deployment.status;
        if (status === 'success' || status === 'failed' || status === 'rolled_back') {
          acc[date][status] += 1;
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
  });
}

/**
 * Sets up real-time Supabase subscriptions for deployment and incident updates.
 * Automatically invalidates relevant queries and shows toast notifications.
 * 
 * @remarks
 * This hook should be used once at the dashboard level to avoid duplicate subscriptions.
 * It handles both deployment_metrics and deployment_incidents table changes.
 * 
 * @example
 * // In a dashboard component
 * function DeploymentDashboard() {
 *   useDeploymentRealtimeUpdates(); // Sets up subscriptions
 *   // ... rest of component
 * }
 */
export function useDeploymentRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const deploymentsChannel = supabase
      .channel('deployment-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deployment_metrics' },
        (payload) => {
          toast.info(`New deployment started: ${payload.new.commit_sha?.substring(0, 7)}`);
          queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deployment_metrics' },
        (payload) => {
          const status = payload.new.status;
          if (status === 'success') {
            toast.success('Deployment completed successfully');
          } else if (status === 'failed') {
            toast.error('Deployment failed');
          } else if (status === 'rolled_back') {
            toast.warning('Deployment rolled back');
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
        }
      )
      .subscribe();

    const incidentsChannel = supabase
      .channel('incident-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deployment_incidents' },
        (payload) => {
          toast.error(`New incident detected: ${payload.new.incident_type}`);
          queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.deployments.statistics() });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deployment_incidents' },
        (payload) => {
          if (payload.new.resolved_at && !payload.old?.resolved_at) {
            toast.success('Incident resolved');
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deploymentsChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, [queryClient]);
}

/**
 * Options for the useDeploymentData hook.
 */
interface UseDeploymentDataOptions {
  /** Number of days to look back for statistics and trends (default: 30) */
  daysBack?: number;
  /** Maximum number of items for recent lists (default: 10) */
  limit?: number;
}

/**
 * Combined hook that provides all deployment metrics data with real-time updates.
 * This is the recommended hook for dashboard views that need comprehensive data.
 * 
 * @param options - Configuration options for data fetching
 * @returns Object containing all deployment data queries and loading states
 * 
 * @example
 * function DeploymentMetricsPage() {
 *   const {
 *     statistics,
 *     recentDeployments,
 *     recentIncidents,
 *     trend,
 *     isLoading,
 *     isError,
 *   } = useDeploymentData({ daysBack: 30, limit: 10 });
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (isError) return <ErrorMessage />;
 * 
 *   return (
 *     <div>
 *       <StatsCards data={statistics.data} />
 *       <TrendChart data={trend.data} />
 *       <DeploymentList data={recentDeployments.data} />
 *     </div>
 *   );
 * }
 */
export function useDeploymentData(options?: UseDeploymentDataOptions) {
  const { daysBack = 30, limit = 10 } = options || {};

  const statistics = useDeploymentStatistics(daysBack);
  const recentDeployments = useRecentDeployments(limit);
  const recentIncidents = useRecentIncidents(limit);
  const trend = useDeploymentTrend(daysBack);

  // Set up real-time updates
  useDeploymentRealtimeUpdates();

  return {
    /** Aggregated deployment statistics */
    statistics,
    /** List of recent deployments */
    recentDeployments,
    /** List of recent incidents */
    recentIncidents,
    /** Deployment trend data for charts */
    trend,
    /** True if any query is loading */
    isLoading: statistics.isLoading || recentDeployments.isLoading || recentIncidents.isLoading || trend.isLoading,
    /** True if any query has an error */
    isError: statistics.isError || recentDeployments.isError || recentIncidents.isError || trend.isError,
  };
}
