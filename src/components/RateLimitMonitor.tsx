import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertCircle } from 'lucide-react';
import { useEnvironmentMode } from '@/hooks/useProfile';
import { useRateLimitConfig, useRateLimitUsage } from '@/hooks/useRateLimits';
import { formatTime, getStatusColor, getProgressColor, capitalize } from '@/lib/formatters';

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

  const { data: environmentMode } = useEnvironmentMode(user?.id);
  const { data: rateLimits } = useRateLimitConfig(environmentMode);
  const { data: rateLimitUsage } = useRateLimitUsage(user?.id, environmentMode, rateLimits);

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
          Real-time usage across all endpoints ({environmentMode} mode)
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
                <h4 className="font-medium capitalize">{capitalize(endpoint.endpoint)}</h4>
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
