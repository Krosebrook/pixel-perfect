import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/test-utils';
import {
  useAnalyticsSummary,
  useDailySpending,
  useCostByEndpoint,
  useHourlyDistribution,
} from '../useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { createWrapper } from '@/test/test-utils';

vi.mock('@/integrations/supabase/client');

describe('useAnalyticsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate analytics summary correctly', async () => {
    const mockData = [
      {
        total_cost: 10.5,
        total_latency_ms: 1500,
        responses: { success: true },
        created_at: new Date().toISOString(),
      },
      {
        total_cost: 8.2,
        total_latency_ms: 1200,
        responses: { success: true },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useAnalyticsSummary('test-user-id', '7'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.totalRuns).toBe(2);
    expect(result.current.data?.totalCost).toBeCloseTo(18.7);
  });
});

describe('useDailySpending', () => {
  it('should group spending by day', async () => {
    const mockData = [
      {
        total_cost: 10,
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        total_cost: 5,
        created_at: '2024-01-15T14:00:00Z',
      },
      {
        total_cost: 8,
        created_at: '2024-01-16T10:00:00Z',
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useDailySpending('test-user-id', '7'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});

describe('useCostByEndpoint', () => {
  it('should aggregate cost by endpoint', async () => {
    const mockData = [
      {
        responses: { endpoint: 'run-comparison' },
        total_cost: 10,
      },
      {
        responses: { endpoint: 'generate-prompt' },
        total_cost: 5,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useCostByEndpoint('test-user-id', '7'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe('useHourlyDistribution', () => {
  it('should group calls by hour', async () => {
    const mockData = [
      { created_at: '2024-01-15T10:30:00Z' },
      { created_at: '2024-01-15T10:45:00Z' },
      { created_at: '2024-01-15T14:00:00Z' },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { result } = renderHook(() => useHourlyDistribution('test-user-id', '7'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
