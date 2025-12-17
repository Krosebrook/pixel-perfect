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

/** Chart color scheme using semantic tokens where possible */
export const DEPLOYMENT_COLORS = {
  success: '#22c55e',
  failed: '#ef4444',
  rolled_back: '#f59e0b',
} as const;

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

/**
 * Calculates status distribution from deployments for pie chart
 */
export function calculateStatusDistribution(deployments: DeploymentMetric[] | undefined): StatusDistributionData[] {
  if (!deployments) return [];

  return [
    { name: 'Success', value: deployments.filter((d) => d.status === 'success').length, color: DEPLOYMENT_COLORS.success },
    { name: 'Failed', value: deployments.filter((d) => d.status === 'failed').length, color: DEPLOYMENT_COLORS.failed },
    { name: 'Rolled Back', value: deployments.filter((d) => d.status === 'rolled_back').length, color: DEPLOYMENT_COLORS.rolled_back },
  ];
}

interface DeploymentTrendChartProps {
  data: DeploymentTrendData[] | undefined;
}

/**
 * Line chart showing deployment trends over time
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

interface StatusDistributionChartProps {
  deployments: DeploymentMetric[] | undefined;
}

/**
 * Pie chart showing status distribution of recent deployments
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
