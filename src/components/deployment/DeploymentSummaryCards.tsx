import { Activity, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DeploymentStats {
  success_rate?: number;
  successful_deployments?: number;
  total_deployments?: number;
  rollback_count?: number;
  avg_deployment_duration_seconds?: number;
  avg_resolution_time_minutes?: number;
  resolved_incidents?: number;
  total_incidents?: number;
}

interface DeploymentSummaryCardsProps {
  stats: DeploymentStats | undefined;
}

/**
 * Grid of summary cards showing key deployment metrics
 */
export function DeploymentSummaryCards({ stats }: DeploymentSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
          <p className="text-xs text-muted-foreground">
            {stats?.successful_deployments || 0} of {stats?.total_deployments || 0} deployments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Rollbacks</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.rollback_count || 0}</div>
          <p className="text-xs text-muted-foreground">Automatic rollbacks triggered</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.avg_deployment_duration_seconds
              ? `${Math.round(stats.avg_deployment_duration_seconds / 60)}m`
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">Average deployment time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Incident Resolution</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.avg_resolution_time_minutes
              ? `${Math.round(stats.avg_resolution_time_minutes)}m`
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.resolved_incidents || 0} of {stats?.total_incidents || 0} resolved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
