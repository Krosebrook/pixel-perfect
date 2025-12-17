import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeploymentData } from '@/hooks/useDeploymentMetrics';
import {
  DeploymentSummaryCards,
  DeploymentTrendChart,
  StatusDistributionChart,
  DeploymentList,
  IncidentList,
} from '@/components/deployment';
import { BudgetManager } from '@/components/BudgetManager';
import { DeploymentComparison } from '@/components/DeploymentComparison';
import { ChangelogViewer } from '@/components/ChangelogViewer';

/**
 * Deployment Metrics Dashboard
 * Displays deployment health, trends, incidents, and budget management
 */
export default function DeploymentMetrics() {
  const { statistics, recentDeployments, recentIncidents, trend } = useDeploymentData();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
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
      <DeploymentSummaryCards stats={statistics.data} />

      {/* Tabbed Content */}
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
            <DeploymentTrendChart data={trend.data} />
            <StatusDistributionChart deployments={recentDeployments.data} />
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <DeploymentList deployments={recentDeployments.data} />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <IncidentList incidents={recentIncidents.data} />
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
