import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, AlertCircle, CheckCircle2, Clock, Radio, TrendingUp, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { BudgetManager } from "@/components/BudgetManager";
import { DeploymentComparison } from "@/components/DeploymentComparison";
import { ChangelogViewer } from "@/components/ChangelogViewer";

const COLORS = {
  success: "#22c55e",
  failed: "#ef4444",
  rolled_back: "#f59e0b",
  healthy: "#22c55e",
  unhealthy: "#ef4444",
};

export default function DeploymentMetrics() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["deployment-statistics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_deployment_statistics", { days_back: 30 });
      if (error) throw error;
      return data[0];
    },
  });

  const { data: recentDeployments } = useQuery({
    queryKey: ["recent-deployments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployment_metrics")
        .select("*")
        .eq("deployment_type", "production")
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentIncidents } = useQuery({
    queryKey: ["recent-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployment_incidents")
        .select("*, deployment_metrics(*)")
        .order("detected_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: deploymentTrend } = useQuery({
    queryKey: ["deployment-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("deployment_metrics")
        .select("started_at, status")
        .eq("deployment_type", "production")
        .gte("started_at", thirtyDaysAgo.toISOString())
        .order("started_at", { ascending: true });

      if (error) throw error;

      const grouped = data.reduce((acc: Record<string, { date: string; success: number; failed: number; rolled_back: number }>, deployment) => {
        const date = new Date(deployment.started_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, success: 0, failed: 0, rolled_back: 0 };
        }
        const status = deployment.status;
        if (status === 'success' || status === 'failed' || status === 'rolled_back') {
          acc[date][status] = acc[date][status] + 1;
        }
        return acc;
      }, {});

      return Object.values(grouped);
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const deploymentsChannel = supabase
      .channel("deployment-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deployment_metrics" },
        (payload) => {
          toast.info(`New deployment started: ${payload.new.commit_sha?.substring(0, 7)}`);
          queryClient.invalidateQueries({ queryKey: ["recent-deployments"] });
          queryClient.invalidateQueries({ queryKey: ["deployment-statistics"] });
          queryClient.invalidateQueries({ queryKey: ["deployment-trend"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deployment_metrics" },
        (payload) => {
          const status = payload.new.status;
          if (status === "success") {
            toast.success(`Deployment completed successfully`);
          } else if (status === "failed") {
            toast.error(`Deployment failed`);
          } else if (status === "rolled_back") {
            toast.warning(`Deployment rolled back`);
          }
          queryClient.invalidateQueries({ queryKey: ["recent-deployments"] });
          queryClient.invalidateQueries({ queryKey: ["deployment-statistics"] });
        }
      )
      .subscribe();

    const incidentsChannel = supabase
      .channel("incident-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deployment_incidents" },
        (payload) => {
          toast.error(`New incident detected: ${payload.new.incident_type}`);
          queryClient.invalidateQueries({ queryKey: ["recent-incidents"] });
          queryClient.invalidateQueries({ queryKey: ["deployment-statistics"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deployment_incidents" },
        (payload) => {
          if (payload.new.resolved_at && !payload.old?.resolved_at) {
            toast.success(`Incident resolved`);
          }
          queryClient.invalidateQueries({ queryKey: ["recent-incidents"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deploymentsChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, [queryClient]);

  const statusDistribution = recentDeployments
    ? [
        { name: "Success", value: recentDeployments.filter((d) => d.status === "success").length, color: COLORS.success },
        { name: "Failed", value: recentDeployments.filter((d) => d.status === "failed").length, color: COLORS.failed },
        { name: "Rolled Back", value: recentDeployments.filter((d) => d.status === "rolled_back").length, color: COLORS.rolled_back },
      ]
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "rolled_back":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      rolled_back: "secondary",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Deployment Metrics</h1>
          <p className="text-muted-foreground">
            Track deployment health, success rates, and incident resolution over the past 30 days
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Radio className="h-3 w-3 text-success animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Summary Cards */}
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
                : "N/A"}
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
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.resolved_incidents || 0} of {stats?.total_incidents || 0} resolved
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Trend</CardTitle>
                <CardDescription>Daily deployment activity over 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={deploymentTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="success" stroke={COLORS.success} name="Success" />
                    <Line type="monotone" dataKey="failed" stroke={COLORS.failed} name="Failed" />
                    <Line type="monotone" dataKey="rolled_back" stroke={COLORS.rolled_back} name="Rolled Back" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Recent deployment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
              <CardDescription>Last 10 production deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeployments?.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(deployment.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono">{deployment.commit_sha.substring(0, 7)}</code>
                          {getStatusBadge(deployment.status)}
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
                {!recentDeployments?.length && (
                  <p className="text-center text-muted-foreground py-8">No deployments recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>Latest deployment incidents and resolution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIncidents?.map((incident) => (
                  <div key={incident.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{incident.severity}</Badge>
                          <Badge variant="outline">{incident.incident_type.replace(/_/g, " ")}</Badge>
                          {incident.resolved_at && <Badge variant="default">Resolved</Badge>}
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Commit:</strong>{" "}
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
                {!recentIncidents?.length && (
                  <p className="text-center text-muted-foreground py-8">No incidents recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-6">
          <ChangelogViewer />
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <BudgetManager />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <DeploymentComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
