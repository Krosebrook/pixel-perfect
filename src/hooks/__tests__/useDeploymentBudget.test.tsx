/**
 * @fileoverview Unit tests for deployment budget hooks.
 * Tests CRUD operations, alert management, and period comparison logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useDeploymentBudgets,
  useDeploymentAlerts,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useAcknowledgeAlert,
  useComparePeriods,
} from '../useDeploymentBudget';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Test wrapper with providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      );
    },
    queryClient,
  };
};

// Mock data
const mockBudgets = [
  {
    id: 'budget-1',
    budget_type: 'deployment_count',
    limit_value: 50,
    current_value: 25,
    period: 'monthly',
    period_start: '2024-01-01',
    alert_threshold: 80,
    email_notifications_enabled: true,
    notification_email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'budget-2',
    budget_type: 'failure_count',
    limit_value: 10,
    current_value: 3,
    period: 'weekly',
    period_start: '2024-01-15',
    alert_threshold: 50,
    email_notifications_enabled: false,
    notification_email: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

const mockAlerts = [
  {
    id: 'alert-1',
    budget_id: 'budget-1',
    alert_type: 'threshold_exceeded',
    threshold_percentage: 80,
    message: 'Budget threshold exceeded',
    is_acknowledged: false,
    triggered_at: '2024-01-20T10:00:00Z',
    acknowledged_at: null,
    acknowledged_by: null,
  },
];

const mockComparison = [
  {
    metric_name: 'total_deployments',
    period1_value: 45,
    period2_value: 50,
    change_percentage: 11.1,
    change_direction: 'increase',
  },
  {
    metric_name: 'success_rate',
    period1_value: 85,
    period2_value: 90,
    change_percentage: 5.9,
    change_direction: 'increase',
  },
];

describe('useDeploymentBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches deployment budgets ordered by created_at', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBudgets, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useDeploymentBudgets(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('deployment_budgets');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result.current.data).toEqual(mockBudgets);
  });

  it('handles fetch errors', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } }),
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useDeploymentBudgets(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeploymentAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches unacknowledged alerts by default', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockAlerts, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useDeploymentAlerts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.from).toHaveBeenCalledWith('deployment_alerts');
    expect(mockEq).toHaveBeenCalledWith('is_acknowledged', false);
    expect(mockOrder).toHaveBeenCalledWith('triggered_at', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(20);
  });

  it('fetches acknowledged alerts when specified', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const { wrapper } = createTestWrapper();
    renderHook(() => useDeploymentAlerts(true), { wrapper });

    await waitFor(() => expect(mockEq).toHaveBeenCalledWith('is_acknowledged', true));
  });
});

describe('useCreateBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new budget and invalidates cache', async () => {
    const newBudget = {
      budget_type: 'deployment_count',
      limit_value: 100,
      period: 'monthly',
      period_start: '2024-02-01',
      alert_threshold: 80,
      email_notifications_enabled: true,
      notification_email: 'test@example.com',
    };

    const createdBudget = { id: 'new-budget', ...newBudget };
    const mockSingle = vi.fn().mockResolvedValue({ data: createdBudget, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    const { wrapper, queryClient } = createTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateBudget(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(newBudget as any);
    });

    expect(mockInsert).toHaveBeenCalledWith(newBudget);
    expect(toast.success).toHaveBeenCalledWith('Budget created successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deployment-budgets'] });
  });

  it('shows error toast on creation failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation failed' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useCreateBudget(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({} as any);
      } catch {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates budget and invalidates cache', async () => {
    const updates = { id: 'budget-1', limit_value: 75 };
    const updatedBudget = { ...mockBudgets[0], limit_value: 75 };

    const mockSingle = vi.fn().mockResolvedValue({ data: updatedBudget, error: null });
    const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

    const { wrapper, queryClient } = createTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateBudget(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(updates);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ limit_value: 75 });
    expect(mockEq).toHaveBeenCalledWith('id', 'budget-1');
    expect(toast.success).toHaveBeenCalledWith('Budget updated successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deployment-budgets'] });
  });
});

describe('useDeleteBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes budget and invalidates cache', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

    const { wrapper, queryClient } = createTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteBudget(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('budget-1');
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'budget-1');
    expect(toast.success).toHaveBeenCalledWith('Budget deleted successfully');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deployment-budgets'] });
  });
});

describe('useAcknowledgeAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acknowledges alert with user ID and timestamp', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

    const { wrapper, queryClient } = createTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAcknowledgeAlert(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'alert-1', acknowledgedBy: 'user-123' });
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_acknowledged: true,
        acknowledged_by: 'user-123',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'alert-1');
    expect(toast.success).toHaveBeenCalledWith('Alert acknowledged');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deployment-alerts'] });
  });
});

describe('useComparePeriods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches period comparison when all dates are provided', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockComparison, error: null } as any);

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(
      () => useComparePeriods('2024-01-01', '2024-01-15', '2024-01-16', '2024-01-31'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(supabase.rpc).toHaveBeenCalledWith('compare_deployment_periods', {
      period1_start: '2024-01-01',
      period1_end: '2024-01-15',
      period2_start: '2024-01-16',
      period2_end: '2024-01-31',
    });
    expect(result.current.data).toEqual(mockComparison);
  });

  it('does not fetch when dates are incomplete', async () => {
    const { wrapper } = createTestWrapper();
    const { result } = renderHook(
      () => useComparePeriods('2024-01-01', null, '2024-01-16', '2024-01-31'),
      { wrapper }
    );

    // Should not be loading since query is disabled
    expect(result.current.isFetching).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns null when any date is missing', async () => {
    const { wrapper } = createTestWrapper();
    const { result } = renderHook(
      () => useComparePeriods(null, null, null, null),
      { wrapper }
    );

    expect(result.current.data).toBeUndefined();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
