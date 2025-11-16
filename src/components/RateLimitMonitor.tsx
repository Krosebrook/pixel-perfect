import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertCircle } from 'lucide-react';

interface RateLimitData {
  endpoint: string;
  minute: { used: number; limit: number; resetIn: number };
  hour: { used: number; limit: number; resetIn: number };
  day: { used: number; limit: number; resetIn: number };
}

export function RateLimitMonitor() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: rateLimits } = useQuery({
    queryKey: ['rate-limit-config', profile?.environment_mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limit_config', {
        _environment_mode: profile?.environment_mode || 'production',
      });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.environment_mode,
  });

  const { data: rateLimitUsage, refetch } = useQuery({
    queryKey: ['rate-limit-usage', user?.id, profile?.environment_mode],
    queryFn: async () => {
      if (!user || !profile?.environment_mode) return [];

      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneDayAgo = new Date(now.getTime() - 86400000);

      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('endpoint_name, calls_count, window_start')
        .eq('user_id', user.id)
        .eq('environment_mode', profile.environment_mode)
        .gte('window_start', oneDayAgo.toISOString());

      if (error) throw error;

      // Group by endpoint and calculate totals
      const endpointData: Record<string, RateLimitData> = {};

      rateLimits?.forEach((limit: any) => {
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
    enabled: !!user && !!profile?.environment_mode && !!rateLimits,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-primary';
  };

  if (!rateLimitUsage || rateLimitUsage.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Rate Limit Monitor
        </CardTitle>
        <CardDescription>
          Real-time usage across all endpoints ({profile?.environment_mode} mode)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rateLimitUsage.map((endpoint) => {
          const minutePercentage = (endpoint.minute.used / endpoint.minute.limit) * 100;
          const hourPercentage = (endpoint.hour.used / endpoint.hour.limit) * 100;
          const dayPercentage = (endpoint.day.used / endpoint.day.limit) * 100;

          return (
            <div key={endpoint.endpoint} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium capitalize">{endpoint.endpoint}</h4>
                {(minutePercentage >= 90 || hourPercentage >= 90 || dayPercentage >= 90) && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Near Limit
                  </Badge>
                )}
              </div>

              {/* Per Minute */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Per Minute</span>
                    <span className={getStatusColor(minutePercentage)}>
                      {endpoint.minute.used} / {endpoint.minute.limit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                      Resets in {formatTime(endpoint.minute.resetIn)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={minutePercentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(minutePercentage)}
                />
              </div>

              {/* Per Hour */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Per Hour</span>
                    <span className={getStatusColor(hourPercentage)}>
                      {endpoint.hour.used} / {endpoint.hour.limit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                      Resets in {formatTime(endpoint.hour.resetIn)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={hourPercentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(hourPercentage)}
                />
              </div>

              {/* Per Day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Per Day</span>
                    <span className={getStatusColor(dayPercentage)}>
                      {endpoint.day.used} / {endpoint.day.limit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                      Resets in {formatTime(endpoint.day.resetIn)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={dayPercentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(dayPercentage)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
