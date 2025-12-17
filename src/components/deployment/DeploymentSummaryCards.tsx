/**
 * @fileoverview Summary cards displaying key deployment metrics at a glance.
 * Provides a dashboard overview of deployment health.
 */

import { Activity, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Statistics data structure returned from deployment statistics queries.
 */
interface DeploymentStats {
  /** Percentage of successful deployments (0-100) */
  success_rate?: number;
  /** Total count of successful deployments */
  successful_deployments?: number;
  /** Total count of all deployments */
  total_deployments?: number;
  /** Count of automatic rollbacks triggered */
  rollback_count?: number;
  /** Average time for a deployment to complete in seconds */
  avg_deployment_duration_seconds?: number;
  /** Average time to resolve incidents in minutes */
  avg_resolution_time_minutes?: number;
  /** Count of resolved incidents */
  resolved_incidents?: number;
  /** Total count of all incidents */
  total_incidents?: number;
}

/**
 * Props for DeploymentSummaryCards component.
 */
interface DeploymentSummaryCardsProps {
  /** Deployment statistics data */
  stats: DeploymentStats | undefined;
}

/**
 * Grid of summary cards displaying key deployment metrics.
 * Shows success rate, rollbacks, average duration, and incident resolution stats.
 * 
 * @param props - Component props
 * @param props.stats - Statistics object from useDeploymentStatistics hook
 * @returns A responsive grid of metric cards
 * 
 * @example
 * const { data: stats } = useDeploymentStatistics(30);
 * <DeploymentSummaryCards stats={stats} />
 */
export function DeploymentSummaryCards({ stats }: DeploymentSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Success Rate Card */}
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

      {/* Rollbacks Card */}
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

      {/* Average Duration Card */}
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

      {/* Incident Resolution Card */}
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
