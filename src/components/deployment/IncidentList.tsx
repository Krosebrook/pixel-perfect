import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DeploymentIncident } from '@/types/deployment';

interface IncidentListProps {
  incidents: DeploymentIncident[] | undefined;
}

/**
 * List of recent deployment incidents with resolution status
 */
export function IncidentList({ incidents }: IncidentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
        <CardDescription>Latest deployment incidents and resolution status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents?.map((incident) => (
            <div key={incident.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">{incident.severity}</Badge>
                    <Badge variant="outline">{incident.incident_type.replace(/_/g, ' ')}</Badge>
                    {incident.resolved_at && <Badge variant="default">Resolved</Badge>}
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Commit:</strong>{' '}
                      <code className="text-xs">
                        {incident.deployment_metrics?.commit_sha.substring(0, 7)}
                      </code>
                    </p>
                    <p className="text-muted-foreground">
                      Detected {formatDistanceToNow(new Date(incident.detected_at), { addSuffix: true })}
                    </p>
                    {incident.resolved_at && incident.resolution_time_minutes && (
                      <p className="text-success">
                        Resolved in {Math.round(incident.resolution_time_minutes)} minutes
                      </p>
                    )}
                  </div>
                </div>
                {incident.github_issue_url && (
                  <a
                    href={incident.github_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Issue
                  </a>
                )}
              </div>
              {incident.failed_checks && incident.failed_checks.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Failed Checks:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {incident.failed_checks.map((check, idx) => (
                        <li key={idx}>• {check}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              {incident.resolution_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Resolution Notes:</p>
                    <p className="text-sm text-muted-foreground">{incident.resolution_notes}</p>
                  </div>
                </>
              )}
            </div>
          ))}
          {!incidents?.length && (
            <p className="text-center text-muted-foreground py-8">No incidents recorded yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
