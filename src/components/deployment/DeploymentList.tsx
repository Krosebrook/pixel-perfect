/**
 * @fileoverview Component for displaying a list of recent deployments.
 * Shows deployment status, commit info, timing, and links to deployment URLs.
 */

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeploymentStatusIcon, DeploymentStatusBadge } from './DeploymentStatusIcon';
import type { DeploymentMetric } from '@/types/deployment';

/**
 * Props for DeploymentList component.
 */
interface DeploymentListProps {
  /** Array of deployment metrics to display */
  deployments: DeploymentMetric[] | undefined;
}

/**
 * Displays a scrollable list of recent deployments with status and metadata.
 * Each deployment shows commit SHA, status badges, timing info, and optional view link.
 * 
 * @param props - Component props
 * @param props.deployments - Array of deployments from useRecentDeployments hook
 * @returns A card containing the deployment list
 * 
 * @example
 * const { data: deployments } = useRecentDeployments(10);
 * <DeploymentList deployments={deployments} />
 */
export function DeploymentList({ deployments }: DeploymentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deployments</CardTitle>
        <CardDescription>Last 10 production deployments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments?.map((deployment) => (
            <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                <DeploymentStatusIcon status={deployment.status} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono">{deployment.commit_sha.substring(0, 7)}</code>
                    <DeploymentStatusBadge status={deployment.status} />
                    {deployment.health_check_status && (
                      <Badge variant="outline">{deployment.health_check_status}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(deployment.started_at), { addSuffix: true })}
                    {deployment.duration_seconds && (
                      <span> • Duration: {Math.round(deployment.duration_seconds / 60)}m</span>
                    )}
                  </div>
                </div>
              </div>
              {deployment.deployment_url && (
                <a
                  href={deployment.deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View
                </a>
              )}
            </div>
          ))}
          {!deployments?.length && (
            <p className="text-center text-muted-foreground py-8">No deployments recorded yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
