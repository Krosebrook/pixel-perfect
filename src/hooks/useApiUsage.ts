import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ApiUsageData } from '@/types/api';

export function useApiUsage(
  userId: string | undefined,
  environmentMode: string | undefined,
  timeRange: string = '24 hours'
) {
  return useQuery({
    queryKey: ['api-usage', userId, environmentMode, timeRange],
    queryFn: async () => {
      if (!userId || !environmentMode) return null;
      
      const { data, error } = await supabase.rpc('get_api_usage', {
        _user_id: userId,
        _environment_mode: environmentMode,
        _time_range: timeRange,
      });
      
      if (error) throw error;
      return data as ApiUsageData[];
    },
    enabled: !!userId && !!environmentMode,
  });
}
