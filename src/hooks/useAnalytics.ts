import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import type { ModelTestRun } from '@/types/api';

export function useAnalyticsSummary(userId: string | undefined, timeRange: string) {
  const dateFrom = subDays(new Date(), parseInt(timeRange));

  return useQuery({
    queryKey: ['analytics-summary', userId, timeRange],
    queryFn: async () => {
      if (!userId) return null;

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, total_latency_ms, responses, created_at')
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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
    enabled: !!userId,
  });
}

export function useDailySpending(userId: string | undefined, timeRange: string) {
  const dateFrom = subDays(new Date(), parseInt(timeRange));

  return useQuery({
    queryKey: ['daily-spending', userId, timeRange],
    queryFn: async (): Promise<{ date: string; cost: number; count: number }[]> => {
      if (!userId) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at');

      if (!runs) return [];

      // Group by day
      const grouped: Record<string, { date: string; cost: number; count: number }> = {};
      
      runs.forEach((run) => {
        const date = format(new Date(run.created_at), 'MMM dd');
        if (!grouped[date]) {
          grouped[date] = { date, cost: 0, count: 0 };
        }
        grouped[date].cost += run.total_cost || 0;
        grouped[date].count += 1;
      });

      return Object.values(grouped);
    },
    enabled: !!userId,
  });
}

export function useCostByEndpoint(userId: string | undefined, timeRange: string) {
  const dateFrom = subDays(new Date(), parseInt(timeRange));

  return useQuery({
    queryKey: ['cost-by-endpoint', userId, timeRange],
    queryFn: async (): Promise<{ name: string; value: number }[]> => {
      if (!userId) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('total_cost, prompt_text, responses')
        .eq('user_id', userId)
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
    enabled: !!userId,
  });
}

export function useHourlyDistribution(userId: string | undefined, timeRange: string) {
  const dateFrom = subDays(new Date(), parseInt(timeRange));

  return useQuery({
    queryKey: ['hourly-distribution', userId, timeRange],
    queryFn: async (): Promise<{ hour: string; calls: number }[]> => {
      if (!userId) return [];

      const { data: runs } = await supabase
        .from('model_test_runs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFrom.toISOString());

      if (!runs) return [];

      const hourCounts: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourCounts[i] = 0;

      runs.forEach((run) => {
        const hour = new Date(run.created_at).getHours();
        hourCounts[hour] += 1;
      });

      return Object.entries(hourCounts).map(([hour, calls]) => ({
        hour: String(hour).padStart(2, '0') + ':00',
        calls,
      }));
    },
    enabled: !!userId,
  });
}
