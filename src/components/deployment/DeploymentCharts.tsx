/**
 * @fileoverview Chart components for visualizing deployment metrics.
 * Uses recharts library for responsive, interactive charts.
 */

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
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeploymentTrendData } from '@/hooks/useDeploymentMetrics';
import type { DeploymentMetric } from '@/types/deployment';

/**
 * Color scheme for deployment status visualization.
 * Uses semantic colors for consistent meaning across charts.
 */
export const DEPLOYMENT_COLORS = {
  /** Green - successful deployments */
  success: '#22c55e',
  /** Red - failed deployments */
  failed: '#ef4444',
  /** Amber - rolled back deployments */
  rolled_back: '#f59e0b',
} as const;

/**
 * Data structure for status distribution pie chart.
 */
interface StatusDistributionData {
  /** Display name for the status */
  name: string;
  /** Count of deployments with this status */
  value: number;
  /** Hex color for the pie slice */
  color: string;
}

/**
 * Calculates status distribution from deployment data for pie chart visualization.
 * 
 * @param deployments - Array of deployment metrics
 * @returns Array of status distribution data for pie chart
 * 
 * @example
 * const distribution = calculateStatusDistribution(deployments);
 * // Returns: [{ name: 'Success', value: 10, color: '#22c55e' }, ...]
 */
export function calculateStatusDistribution(deployments: DeploymentMetric[] | undefined): StatusDistributionData[] {
  if (!deployments) return [];

  return [
    { name: 'Success', value: deployments.filter((d) => d.status === 'success').length, color: DEPLOYMENT_COLORS.success },
    { name: 'Failed', value: deployments.filter((d) => d.status === 'failed').length, color: DEPLOYMENT_COLORS.failed },
    { name: 'Rolled Back', value: deployments.filter((d) => d.status === 'rolled_back').length, color: DEPLOYMENT_COLORS.rolled_back },
  ];
}

/**
 * Props for DeploymentTrendChart component.
 */
interface DeploymentTrendChartProps {
  /** Trend data grouped by date */
  data: DeploymentTrendData[] | undefined;
}

/**
 * Line chart showing deployment trends over time.
 * Displays success, failed, and rolled back counts per day.
 * 
 * @param props - Component props
 * @param props.data - Array of daily deployment counts
 * @returns A card containing a responsive line chart
 * 
 * @example
 * const { data: trend } = useDeploymentTrend(30);
 * <DeploymentTrendChart data={trend} />
 */
export function DeploymentTrendChart({ data }: DeploymentTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Trend</CardTitle>
        <CardDescription>Daily deployment activity over 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="success" stroke={DEPLOYMENT_COLORS.success} name="Success" />
            <Line type="monotone" dataKey="failed" stroke={DEPLOYMENT_COLORS.failed} name="Failed" />
            <Line type="monotone" dataKey="rolled_back" stroke={DEPLOYMENT_COLORS.rolled_back} name="Rolled Back" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Props for StatusDistributionChart component.
 */
interface StatusDistributionChartProps {
  /** Array of deployment metrics to analyze */
  deployments: DeploymentMetric[] | undefined;
}

/**
 * Pie chart showing the distribution of deployment statuses.
 * Provides a quick overview of deployment health.
 * 
 * @param props - Component props
 * @param props.deployments - Array of deployments to calculate distribution from
 * @returns A card containing a responsive pie chart
 * 
 * @example
 * const { data: deployments } = useRecentDeployments(50);
 * <StatusDistributionChart deployments={deployments} />
 */
export function StatusDistributionChart({ deployments }: StatusDistributionChartProps) {
  const data = calculateStatusDistribution(deployments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
        <CardDescription>Recent deployment outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
