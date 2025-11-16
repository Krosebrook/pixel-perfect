import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { CostTracker } from '../CostTracker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('sonner');

describe('CostTracker', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  it('should not render when loading', () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    const { container } = renderWithProviders(<CostTracker />);
    
    // Component should not render while loading
    expect(container.firstChild).toBeNull();
  });

  it('should display budget information', async () => {
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 45.5,
      alert_threshold: 0.8,
    };

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    expect(screen.getByText(/\$45\.50/)).toBeInTheDocument();
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
  });

  it('should show progress bar with correct percentage', async () => {
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 75,
      alert_threshold: 0.8,
    };

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    expect(screen.getByText(/75\.0%/)).toBeInTheDocument();
  });

  it('should show alert when over threshold', async () => {
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 85,
      alert_threshold: 0.8,
    };

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText(/approaching.*budget limit/i)).toBeInTheDocument();
    });
  });

  it('should show warning when over budget', async () => {
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 110,
      alert_threshold: 0.8,
    };

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText(/exceeded.*monthly budget/i)).toBeInTheDocument();
    });
  });

  it('should open settings dialog on settings button click', async () => {
    const user = userEvent.setup();
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 50,
      alert_threshold: 0.8,
    };

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        })),
      })),
    }));
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    expect(screen.getByText('Budget Settings')).toBeInTheDocument();
  });

  it('should save budget settings successfully', async () => {
    const user = userEvent.setup();
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 50,
      alert_threshold: 0.8,
    };

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn((table: string) => {
      if (table === 'user_budgets') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
            })),
          })),
          upsert: mockUpsert,
        };
      }
    });
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    // Open settings dialog
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Change budget value
    const budgetInput = screen.getByLabelText(/monthly budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '200');

    // Save settings
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Budget settings saved');
  });

  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup();
    const mockBudget = {
      monthly_budget: 100,
      current_spending: 50,
      alert_threshold: 0.8,
    };

    const mockUpsert = vi.fn().mockResolvedValue({ error: new Error('Save failed') });
    const mockFrom = vi.fn((table: string) => {
      if (table === 'user_budgets') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
            })),
          })),
          upsert: mockUpsert,
        };
      }
    });
    (supabase.from as any) = mockFrom;

    renderWithProviders(<CostTracker />);

    await waitFor(() => {
      expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    });

    // Open settings dialog
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);

    // Save settings
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save budget settings');
    });
  });
});
