/**
 * Tests for AnalyticsService
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { analyticsService } from '../analytics.service';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('AnalyticsService', () => {
  const mockTimeRange = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsageStatistics', () => {
    it('should calculate usage statistics correctly', async () => {
      const mockRuns = [
        {
          total_cost: 0.1,
          total_latency_ms: 1000,
          responses: { 'gpt-4': { content: 'Response' } },
        },
        {
          total_cost: 0.2,
          total_latency_ms: 2000,
          responses: { 'gpt-4': { content: 'Response 2' } },
        },
        {
          total_cost: 0.15,
          total_latency_ms: 1500,
          responses: { 'gpt-4': { content: null } }, // Failed run
        },
      ];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: mockRuns,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageStatistics('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      expect(result.data?.totalRuns).toBe(3);
      expect(result.data?.totalCost).toBeCloseTo(0.45);
      expect(result.data?.totalLatency).toBe(4500);
      expect(result.data?.averageLatency).toBe(1500);
      expect(result.data?.averageCost).toBeCloseTo(0.15);
      expect(result.data?.successRate).toBeCloseTo(66.67, 1);
    });

    it('should handle empty data', async () => {
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageStatistics('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      expect(result.data?.totalRuns).toBe(0);
      expect(result.data?.averageLatency).toBe(0);
      expect(result.data?.successRate).toBe(0);
    });

    it('should handle errors', async () => {
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageStatistics('user-1', mockTimeRange);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getUsageByModel', () => {
    it('should aggregate usage by model', async () => {
      const mockRuns = [
        {
          models: ['gpt-4', 'claude-3'],
          total_cost: 0.3,
          total_latency_ms: 2000,
          responses: {
            'gpt-4': { content: 'Response', cost: 0.2, latency_ms: 1000 },
            'claude-3': { content: 'Response', cost: 0.1, latency_ms: 1000 },
          },
        },
        {
          models: ['gpt-4'],
          total_cost: 0.1,
          total_latency_ms: 500,
          responses: {
            'gpt-4': { content: 'Response', cost: 0.1, latency_ms: 500 },
          },
        },
      ];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: mockRuns,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageByModel('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const gpt4Stats = result.data?.find(m => m.modelName === 'gpt-4');
      expect(gpt4Stats?.runCount).toBe(2);
      expect(gpt4Stats?.totalCost).toBeCloseTo(0.3);

      const claudeStats = result.data?.find(m => m.modelName === 'claude-3');
      expect(claudeStats?.runCount).toBe(1);
      expect(claudeStats?.totalCost).toBeCloseTo(0.1);
    });

    it('should calculate success rate per model', async () => {
      const mockRuns = [
        {
          models: ['gpt-4'],
          total_cost: 0.1,
          total_latency_ms: 500,
          responses: {
            'gpt-4': { content: 'Success', cost: 0.1, latency_ms: 500 },
          },
        },
        {
          models: ['gpt-4'],
          total_cost: 0.1,
          total_latency_ms: 500,
          responses: {
            'gpt-4': { content: null, cost: 0.1, latency_ms: 500 }, // Failed
          },
        },
      ];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: mockRuns,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageByModel('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      const gpt4Stats = result.data?.find(m => m.modelName === 'gpt-4');
      expect(gpt4Stats?.successRate).toBe(50);
    });
  });

  describe('getUsageByDay', () => {
    it('should aggregate usage by day', async () => {
      const mockRuns = [
        {
          created_at: '2024-01-15T10:00:00Z',
          total_cost: 0.1,
          prompt_id: 'prompt-1',
        },
        {
          created_at: '2024-01-15T15:00:00Z',
          total_cost: 0.2,
          prompt_id: 'prompt-2',
        },
        {
          created_at: '2024-01-16T10:00:00Z',
          total_cost: 0.15,
          prompt_id: 'prompt-1',
        },
      ];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRuns,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getUsageByDay('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const jan15 = result.data?.find(d => d.date === '2024-01-15');
      expect(jan15?.runCount).toBe(2);
      expect(jan15?.totalCost).toBeCloseTo(0.3);
      expect(jan15?.uniquePrompts).toBe(2);

      const jan16 = result.data?.find(d => d.date === '2024-01-16');
      expect(jan16?.runCount).toBe(1);
      expect(jan16?.uniquePrompts).toBe(1);
    });
  });

  describe('getCostBreakdown', () => {
    it('should calculate cost percentages', async () => {
      // Mock getUsageByModel
      const mockUsageByModel = [
        { modelName: 'gpt-4', runCount: 10, totalCost: 2.0, averageLatency: 1000, successRate: 100 },
        { modelName: 'claude-3', runCount: 5, totalCost: 0.5, averageLatency: 800, successRate: 95 },
      ];

      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  {
                    models: ['gpt-4'],
                    responses: { 'gpt-4': { content: 'x', cost: 2.0, latency_ms: 1000 } },
                  },
                  {
                    models: ['claude-3'],
                    responses: { 'claude-3': { content: 'x', cost: 0.5, latency_ms: 800 } },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await analyticsService.getCostBreakdown('user-1', mockTimeRange);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const gpt4 = result.data?.find(m => m.modelName === 'gpt-4');
      expect(gpt4?.percentageOfTotal).toBeCloseTo(80, 0);

      const claude = result.data?.find(m => m.modelName === 'claude-3');
      expect(claude?.percentageOfTotal).toBeCloseTo(20, 0);
    });
  });

  describe('getApiUsage', () => {
    it('should fetch API usage from RPC', async () => {
      const mockApiUsage = [
        { endpoint_name: '/generate', total_calls: 100, last_call: '2024-01-15T10:00:00Z' },
        { endpoint_name: '/optimize', total_calls: 50, last_call: '2024-01-14T15:00:00Z' },
      ];

      (supabase.rpc as Mock).mockResolvedValue({
        data: mockApiUsage,
        error: null,
      });

      const result = await analyticsService.getApiUsage('user-1', 'sandbox');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].endpointName).toBe('/generate');
      expect(result.data?.[0].totalCalls).toBe(100);
    });

    it('should handle RPC errors', async () => {
      (supabase.rpc as Mock).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const result = await analyticsService.getApiUsage('user-1', 'sandbox');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getModelLeaderboard', () => {
    it('should fetch and transform leaderboard data', async () => {
      const mockLeaderboard = [
        {
          model_name: 'gpt-4',
          avg_latency_ms: 1200,
          avg_cost: 0.02,
          total_usage: 500,
          success_rate: 98,
          cost_efficiency_score: 85,
        },
        {
          model_name: 'claude-3',
          avg_latency_ms: 900,
          avg_cost: 0.015,
          total_usage: 300,
          success_rate: 96,
          cost_efficiency_score: 90,
        },
      ];

      (supabase.rpc as Mock).mockResolvedValue({
        data: mockLeaderboard,
        error: null,
      });

      const result = await analyticsService.getModelLeaderboard(30, 'all');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].modelName).toBe('gpt-4');
      expect(result.data?.[0].avgLatencyMs).toBe(1200);
      expect(result.data?.[0].costEfficiencyScore).toBe(85);
    });

    it('should use default parameters', async () => {
      (supabase.rpc as Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      await analyticsService.getModelLeaderboard();

      expect(supabase.rpc).toHaveBeenCalledWith('get_model_leaderboard', {
        time_range_days: 30,
        category_filter: null,
      });
    });
  });
});
