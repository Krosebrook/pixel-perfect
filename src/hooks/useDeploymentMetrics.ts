import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { DeploymentMetric, DeploymentIncident } from '@/types/deployment';

/**
 * Hook for fetching deployment statistics
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
 * Hook for fetching recent deployments
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
 * Hook for fetching recent incidents with deployment info
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

export interface DeploymentTrendData {
  date: string;
  success: number;
  failed: number;
  rolled_back: number;
}

/**
 * Hook for fetching deployment trend data grouped by day
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
 * Hook for setting up real-time subscriptions for deployment updates
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
 * Combined hook for all deployment metrics data
 */
export function useDeploymentData(options?: { daysBack?: number; limit?: number }) {
  const { daysBack = 30, limit = 10 } = options || {};

  const statistics = useDeploymentStatistics(daysBack);
  const recentDeployments = useRecentDeployments(limit);
  const recentIncidents = useRecentIncidents(limit);
  const trend = useDeploymentTrend(daysBack);

  // Set up real-time updates
  useDeploymentRealtimeUpdates();

  return {
    statistics,
    recentDeployments,
    recentIncidents,
    trend,
    isLoading: statistics.isLoading || recentDeployments.isLoading || recentIncidents.isLoading || trend.isLoading,
    isError: statistics.isError || recentDeployments.isError || recentIncidents.isError || trend.isError,
  };
}
