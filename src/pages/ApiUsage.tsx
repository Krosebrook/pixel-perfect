import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, Activity, DollarSign, Zap } from 'lucide-react';

export default function ApiUsage() {
  const { data: apiUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['api-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: rateLimits } = useQuery({
    queryKey: ['rate-limits'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limit_config', {
        _environment_mode: 'production'
      });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_test_runs')
        .select('created_at, total_cost')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const chartData = recentRuns?.slice(0, 30).reverse().map((run, idx) => ({
    index: idx + 1,
    cost: run.total_cost || 0,
    date: new Date(run.created_at).toLocaleDateString()
  })) || [];

  const usageByEndpoint = apiUsage?.reduce((acc, usage) => {
    const endpoint = usage.endpoint_name?.replace(/-/g, ' ') || 'unknown';
    const existing = acc.find(e => e.endpoint === endpoint);
    if (existing) {
      existing.calls += usage.calls_count || 0;
    } else {
      acc.push({ endpoint, calls: usage.calls_count || 0 });
    }
    return acc;
  }, [] as { endpoint: string; calls: number }[]) || [];

  const totalCalls = usageByEndpoint.reduce((sum, u) => sum + u.calls, 0);
  const totalCost = recentRuns?.reduce((sum, r) => sum + (r.total_cost || 0), 0) || 0;

  if (usageLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              API Usage
            </h1>
            <p className="text-muted-foreground">Monitor your API consumption and costs</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 100 tracked calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">From recent test runs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageByEndpoint.length}</div>
              <p className="text-xs text-muted-foreground">Different endpoints used</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Endpoint</CardTitle>
                <CardDescription>API calls distribution across endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {usageByEndpoint.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageByEndpoint}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="endpoint" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="calls" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No usage data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Over Time</CardTitle>
                <CardDescription>Recent test run costs</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No cost data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>Current rate limit configuration</CardDescription>
              </CardHeader>
              <CardContent>
                {rateLimits && rateLimits.length > 0 ? (
                  <div className="space-y-4">
                    {rateLimits.map((limit: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{limit.endpoint_name?.replace(/-/g, ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {limit.max_calls_per_minute}/min • {limit.max_calls_per_hour}/hr • {limit.max_calls_per_day}/day
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No rate limits configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
