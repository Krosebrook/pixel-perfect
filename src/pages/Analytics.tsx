import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Zap, Activity, Calendar } from 'lucide-react';
import { subDays } from 'date-fns';

export default function Analytics() {
  const { user } = useAuth();
  const [dateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });

  const { data: summaryStats } = useQuery({
    queryKey: ['analytics-summary', user?.id],
    queryFn: async () => {
      const { data: runs } = await supabase.from('model_test_runs').select('total_cost, total_latency_ms, responses').eq('user_id', user!.id).gte('created_at', dateRange.from.toISOString());
      return { totalRuns: runs?.length || 0, totalCost: runs?.reduce((s, r) => s + (r.total_cost || 0), 0) || 0, avgLatency: runs?.length ? runs.reduce((s, r) => s + (r.total_latency_ms || 0), 0) / runs.length : 0, successRate: runs?.length ? (runs.filter(r => r.responses).length / runs.length) * 100 : 0 };
    },
    enabled: !!user,
  });

  const { data: performanceData } = useQuery({
    queryKey: ['analytics-performance', user?.id],
    queryFn: async () => {
      const { data: runs } = await supabase.from('model_test_runs').select('total_latency_ms, total_cost, created_at').eq('user_id', user!.id).gte('created_at', dateRange.from.toISOString()).order('created_at');
      const grouped = runs?.reduce((acc: any, run) => { const date = new Date(run.created_at).toISOString().split('T')[0]; if (!acc[date]) acc[date] = { latencies: [], costs: [], count: 0 }; acc[date].latencies.push(run.total_latency_ms || 0); acc[date].costs.push(run.total_cost || 0); acc[date].count++; return acc; }, {});
      return Object.entries(grouped || {}).map(([date, data]: [string, any]) => ({ date, avgLatency: data.latencies.reduce((a: number, b: number) => a + b, 0) / data.count, totalCost: data.costs.reduce((a: number, b: number) => a + b, 0), runs: data.count }));
    },
    enabled: !!user,
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Analytics Dashboard</h1><p className="text-muted-foreground">Comprehensive insights</p></div>
        <Button variant="outline"><Calendar className="h-4 w-4 mr-2" />Last 30 Days</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total API Calls</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats?.totalRuns.toLocaleString() || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">${summaryStats?.totalCost.toFixed(2) || '0.00'}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Latency</CardTitle><Zap className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats?.avgLatency.toFixed(0) || 0}ms</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Success Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summaryStats?.successRate.toFixed(1) || 0}%</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Performance Over Time</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={400}><LineChart data={performanceData || []}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" /><YAxis /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} /><Legend /><Line type="monotone" dataKey="avgLatency" stroke="hsl(var(--primary))" name="Avg Latency (ms)" /></LineChart></ResponsiveContainer></CardContent></Card>
    </div>
  );
}
