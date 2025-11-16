import { useState } from 'react';
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

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<string>(TIME_RANGES.THIRTY_DAYS);

  const { data: environmentMode } = useEnvironmentMode(user?.id);
  const { data: summaryStats, isLoading: statsLoading } = useAnalyticsSummary(user?.id, timeRange);
  const { data: dailySpending } = useDailySpending(user?.id, timeRange);
  const { data: costByEndpoint } = useCostByEndpoint(user?.id, timeRange);
  const { data: hourlyDistribution } = useHourlyDistribution(user?.id, timeRange);
  const { data: apiUsage } = useApiUsage(user?.id, environmentMode, `${timeRange} days`);

  const apiCallPatterns = apiUsage?.map((u) => ({
    endpoint: formatEndpointName(u.endpoint_name),
    calls: u.total_calls,
  })) || [];

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground">
              Track spending, patterns, and performance
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summaryStats?.totalRuns || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In the last {timeRange} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats?.totalCost || 0)}
              </div>
              <p className={`text-xs mt-1 ${
                (summaryStats?.costTrend || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(summaryStats?.costTrend || 0) > 0 ? '+' : ''}
                {formatPercentage(summaryStats?.costTrend || 0)} vs previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats?.avgLatency.toFixed(0) || 0}ms
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(summaryStats?.successRate || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful API calls
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spending">Spending Trends</TabsTrigger>
            <TabsTrigger value="calls">API Calls</TabsTrigger>
            <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending Trends</CardTitle>
                <CardDescription>
                  Track your spending over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={dailySpending || []}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => [formatCurrency(value, 4), 'Cost']}
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
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>API Calls by Endpoint</CardTitle>
                  <CardDescription>
                    Total calls per endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={apiCallPatterns || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="endpoint" type="category" width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="calls" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Call Volume</CardTitle>
                  <CardDescription>
                    Number of calls per day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySpending || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
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
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Cost by Endpoint
                  </CardTitle>
                  <CardDescription>
                    Distribution of spending across endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costByEndpoint || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {(costByEndpoint || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => formatCurrency(value, 4)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown Table</CardTitle>
                  <CardDescription>
                    Detailed cost per endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(costByEndpoint || []).map((endpoint, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <span className="text-sm font-medium capitalize">{endpoint.name}</span>
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(endpoint.value, 4)}</span>
                      </div>
                    ))}
                    {(!costByEndpoint || costByEndpoint.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No cost data available for this period
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Usage Pattern</CardTitle>
                <CardDescription>
                  API calls distributed by hour of day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hourlyDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="calls" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
