import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  Legend,
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
import { subDays, format } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30');

  const dateFrom = subDays(new Date(), parseInt(timeRange));
  const dateTo = new Date();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Summary statistics
  const { data: summaryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-summary', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return null;

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, total_latency_ms, responses, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom.toISOString());

      const totalRuns = runs?.length || 0;
      const totalCost = runs?.reduce((sum, r) => sum + (r.total_cost || 0), 0) || 0;
      const avgLatency = totalRuns > 0 
        ? runs.reduce((sum, r) => sum + (r.total_latency_ms || 0), 0) / totalRuns 
        : 0;
      const successRate = totalRuns > 0
        ? (runs.filter(r => r.responses).length / totalRuns) * 100
        : 0;

      // Calculate cost trend
      const previousPeriodFrom = subDays(dateFrom, parseInt(timeRange));
      const { data: previousRuns } = await supabase
        .from('model_test_runs')
        .select('total_cost')
        .eq('user_id', user.id)
        .gte('created_at', previousPeriodFrom.toISOString())
        .lt('created_at', dateFrom.toISOString());

      const previousCost = previousRuns?.reduce((sum, r) => sum + (r.total_cost || 0), 0) || 0;
      const costTrend = previousCost > 0 ? ((totalCost - previousCost) / previousCost) * 100 : 0;

      return {
        totalRuns,
        totalCost,
        avgLatency,
        successRate,
        costTrend,
      };
    },
    enabled: !!user,
  });

  // Daily spending trends
  const { data: dailySpending } = useQuery({
    queryKey: ['daily-spending', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at');

      if (!runs) return [];

      // Group by day
      const grouped = runs.reduce((acc: any, run) => {
        const date = format(new Date(run.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, cost: 0, count: 0 };
        }
        acc[date].cost += run.total_cost || 0;
        acc[date].count += 1;
        return acc;
      }, {});

      return Object.values(grouped);
    },
    enabled: !!user,
  });

  // API call patterns
  const { data: apiCallPatterns } = useQuery({
    queryKey: ['api-call-patterns', user?.id, timeRange, profile?.environment_mode],
    queryFn: async () => {
      if (!user || !profile?.environment_mode) return [];

      const { data: usage } = await supabase.rpc('get_api_usage', {
        _user_id: user.id,
        _environment_mode: profile.environment_mode,
        _time_range: `${timeRange} days`,
      });

      return usage?.map((u: any) => ({
        endpoint: u.endpoint_name?.replace(/-/g, ' ') || 'Unknown',
        calls: u.total_calls || 0,
      })) || [];
    },
    enabled: !!user && !!profile?.environment_mode,
  });

  // Cost breakdown by endpoint
  const { data: costByEndpoint } = useQuery({
    queryKey: ['cost-by-endpoint', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, prompt_text, responses')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom.toISOString());

      if (!runs) return [];

      // Estimate endpoint from context
      const endpointCosts: Record<string, number> = {};
      
      runs.forEach((run) => {
        const responseStr = JSON.stringify(run.responses);
        let endpoint = 'general';
        
        if (responseStr.includes('comparison')) endpoint = 'run-comparison';
        else if (run.prompt_text?.includes('optimize')) endpoint = 'optimize-prompt';
        else if (run.prompt_text?.includes('generate')) endpoint = 'generate-prompt';
        
        endpointCosts[endpoint] = (endpointCosts[endpoint] || 0) + (run.total_cost || 0);
      });

      return Object.entries(endpointCosts).map(([name, value]) => ({
        name: name.replace(/-/g, ' '),
        value: parseFloat(value.toFixed(4)),
      }));
    },
    enabled: !!user,
  });

  // Hourly call distribution
  const { data: hourlyDistribution } = useQuery({
    queryKey: ['hourly-distribution', user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom.toISOString());

      if (!runs) return [];

      const hourCounts: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourCounts[i] = 0;

      runs.forEach((run) => {
        const hour = new Date(run.created_at).getHours();
        hourCounts[hour] += 1;
      });

      return Object.entries(hourCounts).map(([hour, calls]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        calls,
      }));
    },
    enabled: !!user,
  });

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
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
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
                {summaryStats?.totalRuns.toLocaleString() || 0}
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
                ${summaryStats?.totalCost.toFixed(2) || '0.00'}
              </div>
              <p className={`text-xs mt-1 ${
                (summaryStats?.costTrend || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(summaryStats?.costTrend || 0) > 0 ? '+' : ''}
                {summaryStats?.costTrend.toFixed(1)}% vs previous period
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
                {summaryStats?.successRate.toFixed(1) || 0}%
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
                    <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => [`$${value.toFixed(4)}`, 'Cost']}
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => `$${value.toFixed(4)}`}
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
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="text-sm font-medium capitalize">{endpoint.name}</span>
                        </div>
                        <span className="text-sm font-bold">${endpoint.value.toFixed(4)}</span>
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
