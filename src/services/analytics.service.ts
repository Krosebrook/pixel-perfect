/**
 * Analytics Service
 * Handles analytics data operations and aggregations
 */

import { BaseService, type ServiceResult } from './base.service';
import type { 
  UsageStatistics, 
  UsageByModel, 
  UsageByDay,
  CostBreakdown,
  ModelPerformanceMetrics,
  ApiEndpointUsage,
} from '@/types/analytics';

interface TimeRangeParams {
  startDate: Date;
  endDate: Date;
}

class AnalyticsService extends BaseService {
  /**
   * Gets usage statistics for a user within a time range
   */
  async getUsageStatistics(
    userId: string,
    timeRange: TimeRangeParams
  ): Promise<ServiceResult<UsageStatistics>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .from('model_test_runs')
        .select('total_cost, total_latency_ms, responses')
        .eq('user_id', userId)
        .gte('created_at', timeRange.startDate.toISOString())
        .lte('created_at', timeRange.endDate.toISOString());

      if (error) throw error;

      const totalRuns = data?.length ?? 0;
      const totalCost = data?.reduce((sum, r) => sum + (r.total_cost ?? 0), 0) ?? 0;
      const totalLatency = data?.reduce((sum, r) => sum + (r.total_latency_ms ?? 0), 0) ?? 0;
      
      // Calculate success rate based on responses with content
      const successfulRuns = data?.filter(r => {
        const responses = r.responses as Record<string, { content?: string }>;
        return Object.values(responses).some(res => res?.content);
      }).length ?? 0;

      return {
        totalRuns,
        totalCost,
        totalLatency,
        averageLatency: totalRuns > 0 ? totalLatency / totalRuns : 0,
        averageCost: totalRuns > 0 ? totalCost / totalRuns : 0,
        successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0,
      };
    });
  }

  /**
   * Gets usage breakdown by model
   */
  async getUsageByModel(
    userId: string,
    timeRange: TimeRangeParams
  ): Promise<ServiceResult<UsageByModel[]>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .from('model_test_runs')
        .select('models, total_cost, total_latency_ms, responses')
        .eq('user_id', userId)
        .gte('created_at', timeRange.startDate.toISOString())
        .lte('created_at', timeRange.endDate.toISOString());

      if (error) throw error;

      // Aggregate by model
      const modelStats = new Map<string, {
        runCount: number;
        totalCost: number;
        totalLatency: number;
        successCount: number;
      }>();

      data?.forEach(run => {
        const responses = run.responses as Record<string, { content?: string; cost?: number; latency_ms?: number }>;
        
        run.models.forEach(model => {
          const existing = modelStats.get(model) ?? {
            runCount: 0,
            totalCost: 0,
            totalLatency: 0,
            successCount: 0,
          };

          const modelResponse = responses[model];
          existing.runCount++;
          existing.totalCost += modelResponse?.cost ?? 0;
          existing.totalLatency += modelResponse?.latency_ms ?? 0;
          if (modelResponse?.content) {
            existing.successCount++;
          }

          modelStats.set(model, existing);
        });
      });

      return Array.from(modelStats.entries()).map(([modelName, stats]) => ({
        modelName,
        runCount: stats.runCount,
        totalCost: stats.totalCost,
        averageLatency: stats.runCount > 0 ? stats.totalLatency / stats.runCount : 0,
        successRate: stats.runCount > 0 ? (stats.successCount / stats.runCount) * 100 : 0,
      }));
    });
  }

  /**
   * Gets usage breakdown by day
   */
  async getUsageByDay(
    userId: string,
    timeRange: TimeRangeParams
  ): Promise<ServiceResult<UsageByDay[]>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .from('model_test_runs')
        .select('created_at, total_cost, prompt_id')
        .eq('user_id', userId)
        .gte('created_at', timeRange.startDate.toISOString())
        .lte('created_at', timeRange.endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by day
      const dayStats = new Map<string, {
        runCount: number;
        totalCost: number;
        promptIds: Set<string>;
      }>();

      data?.forEach(run => {
        const date = run.created_at.split('T')[0];
        const existing = dayStats.get(date) ?? {
          runCount: 0,
          totalCost: 0,
          promptIds: new Set(),
        };

        existing.runCount++;
        existing.totalCost += run.total_cost ?? 0;
        if (run.prompt_id) {
          existing.promptIds.add(run.prompt_id);
        }

        dayStats.set(date, existing);
      });

      return Array.from(dayStats.entries()).map(([date, stats]) => ({
        date,
        runCount: stats.runCount,
        totalCost: stats.totalCost,
        uniquePrompts: stats.promptIds.size,
      }));
    });
  }

  /**
   * Gets cost breakdown for optimization insights
   */
  async getCostBreakdown(
    userId: string,
    timeRange: TimeRangeParams
  ): Promise<ServiceResult<CostBreakdown[]>> {
    return this.execute(async () => {
      const result = await this.getUsageByModel(userId, timeRange);
      
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to get usage by model');
      }

      const totalCost = result.data.reduce((sum, m) => sum + m.totalCost, 0);

      return result.data.map(model => ({
        modelName: model.modelName,
        totalCost: model.totalCost,
        percentageOfTotal: totalCost > 0 ? (model.totalCost / totalCost) * 100 : 0,
        runCount: model.runCount,
        averageCostPerRun: model.runCount > 0 ? model.totalCost / model.runCount : 0,
      }));
    });
  }

  /**
   * Gets API usage statistics
   */
  async getApiUsage(
    userId: string,
    environmentMode: string
  ): Promise<ServiceResult<ApiEndpointUsage[]>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .rpc('get_api_usage', {
          _user_id: userId,
          _environment_mode: environmentMode,
          _time_range: '24 hours',
        });

      if (error) throw error;

      return (data ?? []).map((item: { endpoint_name: string; total_calls: number; last_call: string }) => ({
        endpointName: item.endpoint_name,
        totalCalls: item.total_calls,
        lastCall: item.last_call,
      }));
    });
  }

  /**
   * Gets model leaderboard data
   */
  async getModelLeaderboard(
    timeRangeDays = 30,
    categoryFilter?: string
  ): Promise<ServiceResult<ModelPerformanceMetrics[]>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .rpc('get_model_leaderboard', {
          time_range_days: timeRangeDays,
          category_filter: categoryFilter ?? null,
        });

      if (error) throw error;

      return (data ?? []).map((item: {
        model_name: string;
        avg_latency_ms: number;
        avg_cost: number;
        total_usage: number;
        success_rate: number;
        cost_efficiency_score: number;
      }) => ({
        modelName: item.model_name,
        avgLatencyMs: item.avg_latency_ms,
        avgCost: item.avg_cost,
        totalUsage: item.total_usage,
        successRate: item.success_rate,
        costEfficiencyScore: item.cost_efficiency_score,
      }));
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
