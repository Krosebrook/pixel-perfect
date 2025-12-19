import { useState, useMemo, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  Calendar,
  PieChart as PieChartIcon,
  Loader2,
} from 'lucide-react';
import { useEnvironmentMode } from '@/hooks/useProfile';
import { useApiUsage } from '@/hooks/useApiUsage';
import {
  useAnalyticsSummary,
  useDailySpending,
  useCostByEndpoint,
  useHourlyDistribution,
} from '@/hooks/useAnalytics';
import { CHART_COLORS, TIME_RANGES, TIME_RANGE_LABELS } from '@/lib/constants';
import { formatCurrency, formatNumber, formatPercentage, formatEndpointName } from '@/lib/formatters';
import { CostOptimizationPanel } from '@/components/CostOptimizationPanel';
import { ExportMenu, type ExportFormat } from '@/components/ExportMenu';
import {
  exportAnalyticsAsJSON,
  exportAnalyticsAsCSV,
  exportAnalyticsAsMarkdown,
} from '@/lib/export-utils';

// ============================================================================
// Types
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

interface ChartTooltipStyleProps {
  backgroundColor: string;
  border: string;
  borderRadius: string;
}

// ============================================================================
// Memoized Sub-Components
// ============================================================================

const StatCard = memo(function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card role="region" aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle 
          id={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`} 
          className="text-sm font-medium"
        >
          {title}
        </CardTitle>
        <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" aria-label={`${title}: ${value}`}>
          {value}
        </div>
        {trend ? (
          <p 
            className={`text-xs mt-1 ${trend.isPositive ? 'text-red-600' : 'text-green-600'}`}
            aria-label={`${trend.isPositive ? 'Increased' : 'Decreased'} by ${Math.abs(trend.value)}% vs previous period`}
          >
            {trend.isPositive ? '+' : ''}{formatPercentage(trend.value)} vs previous period
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
});

const SpendingChart = memo(function SpendingChart({ 
  data,
  tooltipStyle 
}: { 
  data: { date: string; cost: number }[];
  tooltipStyle: ChartTooltipStyleProps;
}) {
  return (
    <Card role="region" aria-labelledby="spending-chart-title">
      <CardHeader>
        <CardTitle id="spending-chart-title">Daily Spending Trends</CardTitle>
        <CardDescription>Track your spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} aria-label="Daily spending area chart">
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" aria-label="Date" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} aria-label="Cost" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatCurrency(value, 4), 'Cost']}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

const ApiCallsChart = memo(function ApiCallsChart({
  apiCallPatterns,
  dailySpending,
  tooltipStyle,
}: {
  apiCallPatterns: { endpoint: string; calls: number }[];
  dailySpending: { date: string; count: number }[];
  tooltipStyle: ChartTooltipStyleProps;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card role="region" aria-labelledby="api-calls-endpoint-title">
        <CardHeader>
          <CardTitle id="api-calls-endpoint-title">API Calls by Endpoint</CardTitle>
          <CardDescription>Total calls per endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apiCallPatterns} layout="horizontal" aria-label="API calls by endpoint bar chart">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" aria-label="Number of calls" />
              <YAxis dataKey="endpoint" type="category" width={120} aria-label="Endpoint" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="calls" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card role="region" aria-labelledby="daily-volume-title">
        <CardHeader>
          <CardTitle id="daily-volume-title">Daily Call Volume</CardTitle>
          <CardDescription>Number of calls per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySpending} aria-label="Daily call volume line chart">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" aria-label="Date" />
              <YAxis aria-label="Call count" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

const CostBreakdownSection = memo(function CostBreakdownSection({
  costByEndpoint,
  tooltipStyle,
}: {
  costByEndpoint: { name: string; value: number }[];
  tooltipStyle: ChartTooltipStyleProps;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card role="region" aria-labelledby="cost-pie-chart-title">
        <CardHeader>
          <CardTitle id="cost-pie-chart-title" className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" aria-hidden="true" />
            Cost by Endpoint
          </CardTitle>
          <CardDescription>Distribution of spending across endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart aria-label="Cost by endpoint pie chart">
              <Pie
                data={costByEndpoint}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {costByEndpoint.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value, 4)}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card role="region" aria-labelledby="cost-table-title">
        <CardHeader>
          <CardTitle id="cost-table-title">Cost Breakdown Table</CardTitle>
          <CardDescription>Detailed cost per endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="list" aria-label="Cost breakdown by endpoint">
            {costByEndpoint.map((endpoint, idx) => (
              <div key={idx} className="flex items-center justify-between" role="listitem">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium capitalize">{endpoint.name}</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(endpoint.value, 4)}</span>
              </div>
            ))}
            {costByEndpoint.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No cost data available for this period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

const HourlyPatternChart = memo(function HourlyPatternChart({
  data,
  tooltipStyle,
}: {
  data: { hour: string; calls: number }[];
  tooltipStyle: ChartTooltipStyleProps;
}) {
  return (
    <Card role="region" aria-labelledby="hourly-pattern-title">
      <CardHeader>
        <CardTitle id="hourly-pattern-title">Hourly Usage Pattern</CardTitle>
        <CardDescription>API calls distributed by hour of day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} aria-label="Hourly usage pattern bar chart">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="hour" aria-label="Hour of day" />
            <YAxis aria-label="Number of calls" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="calls" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<string>(TIME_RANGES.THIRTY_DAYS);

  const { data: environmentMode } = useEnvironmentMode(user?.id);
  const { data: summaryStats, isLoading: statsLoading } = useAnalyticsSummary(user?.id, timeRange);
  const { data: dailySpending } = useDailySpending(user?.id, timeRange);
  const { data: costByEndpoint } = useCostByEndpoint(user?.id, timeRange);
  const { data: hourlyDistribution } = useHourlyDistribution(user?.id, timeRange);
  const { data: apiUsage } = useApiUsage(user?.id, environmentMode, `${timeRange} days`);

  // Memoized derived data
  const apiCallPatterns = useMemo(
    () => apiUsage?.map((u) => ({
      endpoint: formatEndpointName(u.endpoint_name),
      calls: u.total_calls,
    })) || [],
    [apiUsage]
  );

  const tooltipStyle = useMemo<ChartTooltipStyleProps>(() => ({
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }), []);

  const analyticsData = useMemo(() => ({
    totalRuns: summaryStats?.totalRuns || 0,
    totalCost: summaryStats?.totalCost || 0,
    avgLatency: summaryStats?.avgLatency || 0,
    successRate: summaryStats?.successRate || 0,
    dailySpending: (dailySpending || []) as { date: string; cost: number; count: number }[],
    costByEndpoint: costByEndpoint || [],
  }), [summaryStats, dailySpending, costByEndpoint]);

  const handleExport = useCallback((format: ExportFormat) => {
    if (format === 'json') exportAnalyticsAsJSON(analyticsData, timeRange);
    else if (format === 'csv') exportAnalyticsAsCSV(analyticsData, timeRange);
    else exportAnalyticsAsMarkdown(analyticsData, timeRange);
  }, [analyticsData, timeRange]);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value);
  }, []);

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4 flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading analytics" />
          <span className="sr-only">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4 space-y-8" role="main" aria-label="Usage Analytics">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground">
              Track spending, patterns, and performance
            </p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Analytics controls">
            <ExportMenu
              onExport={handleExport}
              disabled={!summaryStats}
            />
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]" aria-label="Select time range">
                <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_RANGES.SEVEN_DAYS}>{TIME_RANGE_LABELS[TIME_RANGES.SEVEN_DAYS]}</SelectItem>
                <SelectItem value={TIME_RANGES.THIRTY_DAYS}>{TIME_RANGE_LABELS[TIME_RANGES.THIRTY_DAYS]}</SelectItem>
                <SelectItem value={TIME_RANGES.SIXTY_DAYS}>{TIME_RANGE_LABELS[TIME_RANGES.SIXTY_DAYS]}</SelectItem>
                <SelectItem value={TIME_RANGES.NINETY_DAYS}>{TIME_RANGE_LABELS[TIME_RANGES.NINETY_DAYS]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Summary Cards */}
        <section 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" 
          aria-label="Summary statistics"
        >
          <StatCard
            title="Total API Calls"
            value={formatNumber(summaryStats?.totalRuns || 0)}
            description={`In the last ${timeRange} days`}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(summaryStats?.totalCost || 0)}
            description="vs previous period"
            icon={<DollarSign className="h-4 w-4" />}
            trend={summaryStats?.costTrend !== undefined ? {
              value: summaryStats.costTrend,
              isPositive: summaryStats.costTrend > 0,
            } : undefined}
          />
          <StatCard
            title="Avg Latency"
            value={`${summaryStats?.avgLatency.toFixed(0) || 0}ms`}
            description="Average response time"
            icon={<Zap className="h-4 w-4" />}
          />
          <StatCard
            title="Success Rate"
            value={formatPercentage(summaryStats?.successRate || 0)}
            description="Successful API calls"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </section>

        {/* Charts */}
        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList aria-label="Analytics views">
            <TabsTrigger value="spending">Spending Trends</TabsTrigger>
            <TabsTrigger value="calls">API Calls</TabsTrigger>
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
            <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-4">
            <SpendingChart data={dailySpending || []} tooltipStyle={tooltipStyle} />
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <ApiCallsChart 
              apiCallPatterns={apiCallPatterns} 
              dailySpending={dailySpending || []}
              tooltipStyle={tooltipStyle}
            />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <CostBreakdownSection 
              costByEndpoint={costByEndpoint || []}
              tooltipStyle={tooltipStyle}
            />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <HourlyPatternChart 
              data={hourlyDistribution || []}
              tooltipStyle={tooltipStyle}
            />
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <CostOptimizationPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default memo(Analytics);
