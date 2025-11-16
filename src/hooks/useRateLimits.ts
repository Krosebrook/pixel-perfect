import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { REFETCH_INTERVALS } from '@/lib/constants';
import type { RateLimitConfig, RateLimitUsage } from '@/types/api';

export function useRateLimitConfig(environmentMode: string | undefined) {
  return useQuery({
    queryKey: ['rate-limit-config', environmentMode],
    queryFn: async () => {
      if (!environmentMode) return null;
      
      const { data, error } = await supabase.rpc('get_rate_limit_config', {
        _environment_mode: environmentMode,
      });
      
      if (error) throw error;
      return data as RateLimitConfig[];
    },
    enabled: !!environmentMode,
  });
}

export function useRateLimitUsage(
  userId: string | undefined,
  environmentMode: string | undefined,
  rateLimits: RateLimitConfig[] | null | undefined
) {
  return useQuery({
    queryKey: ['rate-limit-usage', userId, environmentMode],
    queryFn: async () => {
      if (!userId || !environmentMode || !rateLimits) return [];

      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneDayAgo = new Date(now.getTime() - 86400000);

      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('endpoint_name, calls_count, window_start')
        .eq('user_id', userId)
        .eq('environment_mode', environmentMode)
        .gte('window_start', oneDayAgo.toISOString());

      if (error) throw error;

      // Group by endpoint and calculate totals
      const endpointData: Record<string, RateLimitUsage> = {};

      rateLimits.forEach((limit) => {
        const endpointCalls = data?.filter(c => c.endpoint_name === limit.endpoint_name) || [];

        const callsLastMinute = endpointCalls
          .filter(c => new Date(c.window_start) >= oneMinuteAgo)
          .reduce((sum, c) => sum + c.calls_count, 0);

        const callsLastHour = endpointCalls
          .filter(c => new Date(c.window_start) >= oneHourAgo)
          .reduce((sum, c) => sum + c.calls_count, 0);

        const callsLastDay = endpointCalls
          .reduce((sum, c) => sum + c.calls_count, 0);

        // Calculate reset times
        const nextMinute = new Date(Math.ceil(now.getTime() / 60000) * 60000);
        const nextHour = new Date(Math.ceil(now.getTime() / 3600000) * 3600000);
        const nextDay = new Date(now);
        nextDay.setHours(24, 0, 0, 0);

        endpointData[limit.endpoint_name] = {
          endpoint: limit.endpoint_name.replace(/-/g, ' '),
          minute: {
            used: callsLastMinute,
            limit: limit.max_calls_per_minute,
            resetIn: Math.max(0, nextMinute.getTime() - now.getTime()),
          },
          hour: {
            used: callsLastHour,
            limit: limit.max_calls_per_hour,
            resetIn: Math.max(0, nextHour.getTime() - now.getTime()),
          },
          day: {
            used: callsLastDay,
            limit: limit.max_calls_per_day,
            resetIn: Math.max(0, nextDay.getTime() - now.getTime()),
          },
        };
      });

      return Object.values(endpointData);
    },
    enabled: !!userId && !!environmentMode && !!rateLimits,
    refetchInterval: REFETCH_INTERVALS.FAST,
  });
}
