import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const RATE_LIMITS: Record<string, Record<string, { max_calls_per_hour: number }>> = {
  sandbox: {
    'run-comparison': { max_calls_per_hour: 50 },
    'run-comparison-stream': { max_calls_per_hour: 30 },
    'generate-insights': { max_calls_per_hour: 30 },
    'generate-prompt': { max_calls_per_hour: 100 },
    'optimize-prompt': { max_calls_per_hour: 50 },
    'validate-quality': { max_calls_per_hour: 100 },
    'apply-template': { max_calls_per_hour: 200 },
  },
  production: {
    'run-comparison': { max_calls_per_hour: 1000 },
    'run-comparison-stream': { max_calls_per_hour: 500 },
    'generate-insights': { max_calls_per_hour: 500 },
    'generate-prompt': { max_calls_per_hour: 2000 },
    'optimize-prompt': { max_calls_per_hour: 1000 },
    'validate-quality': { max_calls_per_hour: 2000 },
    'apply-template': { max_calls_per_hour: 4000 },
  },
};

export function RateLimitWarning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: rateLimitStatus } = useQuery({
    queryKey: ['rate-limit-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', user.id)
        .single();
      
      const environmentMode = profile?.environment_mode || 'production';
      
      const { data, error } = await supabase.rpc('get_api_usage', {
        _user_id: user.id,
        _environment_mode: environmentMode,
        _time_range: '1 hour'
      });
      
      if (error) throw error;
      return { usage: data, environmentMode };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!rateLimitStatus?.usage) return;

    const { usage, environmentMode } = rateLimitStatus;
    
    usage.forEach((endpoint: any) => {
      const warningKey = `${endpoint.endpoint_name}-${Math.floor(Date.now() / 60000)}`;
      if (dismissed.includes(warningKey)) return;

      const limits = RATE_LIMITS[environmentMode as 'sandbox' | 'production'];
      const limit = limits[endpoint.endpoint_name];
      
      if (!limit) return;

      const percentUsed = (endpoint.total_calls / limit.max_calls_per_hour) * 100;

      if (percentUsed >= 80 && percentUsed < 100) {
        toast({
          title: "⚠️ Approaching Rate Limit",
          description: `You've used ${endpoint.total_calls}/${limit.max_calls_per_hour} API calls for ${endpoint.endpoint_name} this hour (${percentUsed.toFixed(0)}%).`,
          duration: 10000,
        });
        setDismissed(prev => [...prev, warningKey]);
      }
      
      if (percentUsed >= 100) {
        toast({
          variant: "destructive",
          title: "🚫 Rate Limit Reached",
          description: `You've hit the rate limit for ${endpoint.endpoint_name}. Resets in ${60 - new Date().getMinutes()} minutes.`,
          duration: 15000,
        });
        setDismissed(prev => [...prev, warningKey]);
      }
    });
  }, [rateLimitStatus, toast, dismissed]);

  return null;
}
