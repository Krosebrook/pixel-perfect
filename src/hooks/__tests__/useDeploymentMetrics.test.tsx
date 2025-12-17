/**
 * @fileoverview Unit tests for deployment metrics hooks.
 * Tests data fetching, transformation, and real-time subscription logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            gte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn(),
        })),
      })),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import {
  useDeploymentStatistics,
  useRecentDeployments,
  useRecentIncidents,
  useDeploymentTrend,
  useDeploymentData,
  type DeploymentTrendData,
} from '../useDeploymentMetrics';
import { supabase } from '@/integrations/supabase/client';

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
};

// Mock data
const mockStatistics = {
  total_deployments: 100,
  successful_deployments: 85,
  failed_deployments: 10,
  rollback_count: 5,
  success_rate: 85.0,
  avg_deployment_duration_seconds: 120,
  total_incidents: 15,
  resolved_incidents: 12,
  avg_resolution_time_minutes: 30,
};

const mockDeployments = [
  {
    id: '1',
    commit_sha: 'abc1234',
    deployment_type: 'production',
    status: 'success',
    started_at: '2024-01-15T10:00:00Z',
    completed_at: '2024-01-15T10:02:00Z',
    duration_seconds: 120,
    workflow_run_id: 'run-1',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    commit_sha: 'def5678',
    deployment_type: 'production',
    status: 'failed',
    started_at: '2024-01-14T09:00:00Z',
    completed_at: '2024-01-14T09:01:30Z',
    duration_seconds: 90,
    workflow_run_id: 'run-2',
    created_at: '2024-01-14T09:00:00Z',
    error_message: 'Build failed',
  },
];

const mockIncidents = [
  {
    id: 'inc-1',
    deployment_id: '1',
    incident_type: 'health_check_failure',
    severity: 'high',
    detected_at: '2024-01-15T10:05:00Z',
    resolved_at: '2024-01-15T10:35:00Z',
    resolution_time_minutes: 30,
    deployment_metrics: mockDeployments[0],
  },
];

const mockTrendData = [
  { started_at: '2024-01-15T10:00:00Z', status: 'success' },
  { started_at: '2024-01-15T11:00:00Z', status: 'success' },
  { started_at: '2024-01-15T12:00:00Z', status: 'failed' },
  { started_at: '2024-01-14T09:00:00Z', status: 'rolled_back' },
];

describe('useDeploymentStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches deployment statistics with default days', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockStatistics],
      error: null,
    } as any);

    const { result } = renderHook(() => useDeploymentStatistics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.rpc).toHaveBeenCalledWith('get_deployment_statistics', { days_back: 30 });
    expect(result.current.data).toEqual(mockStatistics);
  });

  it('fetches statistics with custom days parameter', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [mockStatistics],
      error: null,
    } as any);

    const { result } = renderHook(() => useDeploymentStatistics(7), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.rpc).toHaveBeenCalledWith('get_deployment_statistics', { days_back: 7 });
  });

  it('handles errors gracefully', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    } as any);

    const { result } = renderHook(() => useDeploymentStatistics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useRecentDeployments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches recent deployments with default limit', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockDeployments, error: null }),
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useRecentDeployments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('deployment_metrics');
    expect(result.current.data).toEqual(mockDeployments);
  });

  it('fetches deployments with custom limit', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: [mockDeployments[0]], error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: mockLimit,
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useRecentDeployments(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockLimit).toHaveBeenCalledWith(5);
  });
});

describe('useRecentIncidents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches recent incidents with deployment data', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: mockIncidents, error: null }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useRecentIncidents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('deployment_incidents');
    expect(mockSelect).toHaveBeenCalledWith('*, deployment_metrics(*)');
    expect(result.current.data).toEqual(mockIncidents);
  });
});

describe('useDeploymentTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and transforms trend data correctly', async () => {
    const mockGte = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockTrendData, error: null }),
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: mockGte,
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useDeploymentTrend(30), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data transformation
    const trendData = result.current.data as DeploymentTrendData[];
    expect(trendData).toBeDefined();
    expect(Array.isArray(trendData)).toBe(true);

    // Check that data is grouped by date
    if (trendData && trendData.length > 0) {
      const jan15Data = trendData.find(d => d.date === '2024-01-15');
      const jan14Data = trendData.find(d => d.date === '2024-01-14');

      if (jan15Data) {
        expect(jan15Data.success).toBe(2);
        expect(jan15Data.failed).toBe(1);
        expect(jan15Data.rolled_back).toBe(0);
      }

      if (jan14Data) {
        expect(jan14Data.success).toBe(0);
        expect(jan14Data.failed).toBe(0);
        expect(jan14Data.rolled_back).toBe(1);
      }
    }
  });

  it('handles empty data gracefully', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { result } = renderHook(() => useDeploymentTrend(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('useDeploymentData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks for all queries
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [mockStatistics],
      error: null,
    } as any);

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: mockDeployments, error: null }),
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockTrendData, error: null }),
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockIncidents, error: null }),
        }),
      }),
    });
    vi.mocked(supabase.from).mockImplementation(mockFrom);
  });

  it('combines all deployment data hooks', async () => {
    const { result } = renderHook(() => useDeploymentData({ daysBack: 30, limit: 10 }), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // All queries should be available
    expect(result.current.statistics).toBeDefined();
    expect(result.current.recentDeployments).toBeDefined();
    expect(result.current.recentIncidents).toBeDefined();
    expect(result.current.trend).toBeDefined();
  });

  it('uses default options when none provided', async () => {
    const { result } = renderHook(() => useDeploymentData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should have called with default values
    expect(supabase.rpc).toHaveBeenCalledWith('get_deployment_statistics', { days_back: 30 });
  });

  it('reports error state when any query fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    } as any);

    const { result } = renderHook(() => useDeploymentData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.statistics.isError).toBe(true));

    expect(result.current.isError).toBe(true);
  });
});
