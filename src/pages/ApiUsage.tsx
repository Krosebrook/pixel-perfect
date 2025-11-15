import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, Activity, DollarSign, Zap } from 'lucide-react';
import { SandboxToggle } from '@/components/SandboxToggle';

export default function ApiUsage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: apiUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['api-usage', user?.id, profile?.environment_mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_api_usage', {
        _user_id: user?.id,
        _environment_mode: profile?.environment_mode || 'production',
        _time_range: '24 hours'
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!profile?.environment_mode
  });

  const { data: rateLimits } = useQuery({
    queryKey: ['rate-limits', profile?.environment_mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limit_config', {
        _environment_mode: profile?.environment_mode || 'production'
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.environment_mode
  });

  const { data: recentRuns } = useQuery({
    queryKey: ['recent-runs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_test_runs')
        .select('created_at, total_cost')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', user?.id, profile?.environment_mode],
    queryFn: async () => {
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('environment_mode', profile?.environment_mode || 'production')
        .eq('period_start', periodStart)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!profile?.environment_mode
  });

  const chartData = recentRuns?.slice(0, 30).reverse().map((run, idx) => ({
    index: idx + 1,
    cost: run.total_cost || 0,
    date: new Date(run.created_at).toLocaleDateString()
  })) || [];

  const usageByEndpoint = apiUsage?.map(usage => ({
    endpoint: usage.endpoint_name?.replace(/-/g, ' '),
    calls: usage.total_calls || 0
  })) || [];

  if (usageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSandbox = profile?.environment_mode === 'sandbox';
  const budgetProgress = budget ? (budget.current_spending / budget.monthly_budget) * 100 : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Usage Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your API calls, rate limits, and budget
          </p>
        </div>
        <Badge variant={isSandbox ? 'secondary' : 'default'} className={
          isSandbox 
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
            : 'bg-green-500/10 text-green-500 border-green-500/20'
        }>
          {isSandbox ? 'Sandbox Mode' : 'Production Mode'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiUsage?.reduce((sum, u) => sum + (u.total_calls || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budget?.current_spending?.toFixed(2) || '0.00'}
            </div>
            <Progress value={budgetProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of ${budget?.monthly_budget?.toFixed(2) || '0.00'} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rateLimits?.[0]?.max_calls_per_minute || 0} calls/min available
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calls">API Calls</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>
            <TabsContent value="calls" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calls by Endpoint (24h)</CardTitle>
                  <CardDescription>API usage breakdown by endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                  {usageByEndpoint.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={usageByEndpoint}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="endpoint" 
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                        <Bar dataKey="calls" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No API calls in the last 24 hours
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Trend</CardTitle>
                  <CardDescription>Recent spending on API calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="index" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))'
                          }}
                          formatter={(value: number) => `$${value.toFixed(4)}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No cost data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
              <CardDescription>Current limits for {isSandbox ? 'sandbox' : 'production'} environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rateLimits?.map((limit: any) => (
                  <div key={limit.endpoint_name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {limit.endpoint_name.replace(/-/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {limit.max_calls_per_minute}/min
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Per min: {limit.max_calls_per_minute}</div>
                      <div>Per hour: {limit.max_calls_per_hour}</div>
                      <div>Per day: {limit.max_calls_per_day}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SandboxToggle />
        </div>
      </div>
    </div>
  );
}
