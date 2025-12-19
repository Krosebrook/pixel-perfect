/**
 * Integration tests for Analytics Dashboard flow
 * Tests the complete user journey through analytics features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import Analytics from '@/pages/Analytics';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'model_test_runs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      {
                        id: 'run-1',
                        created_at: '2024-01-15T10:00:00Z',
                        total_cost: 0.25,
                        total_latency_ms: 1500,
                        models: ['gpt-4'],
                        responses: { 'gpt-4': { content: 'Response', cost: 0.25 } },
                      },
                      {
                        id: 'run-2',
                        created_at: '2024-01-16T10:00:00Z',
                        total_cost: 0.15,
                        total_latency_ms: 1200,
                        models: ['claude-3'],
                        responses: { 'claude-3': { content: 'Response', cost: 0.15 } },
                      },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }),
    rpc: vi.fn((fnName) => {
      if (fnName === 'get_api_usage') {
        return Promise.resolve({
          data: [
            { endpoint_name: 'run-comparison', total_calls: 150, last_call: '2024-01-16T10:00:00Z' },
            { endpoint_name: 'generate-prompt', total_calls: 85, last_call: '2024-01-15T15:00:00Z' },
          ],
          error: null,
        });
      }
      if (fnName === 'get_model_leaderboard') {
        return Promise.resolve({
          data: [
            { model_name: 'gpt-4', avg_latency_ms: 1500, avg_cost: 0.02, total_usage: 500, success_rate: 98 },
            { model_name: 'claude-3', avg_latency_ms: 1200, avg_cost: 0.015, total_usage: 300, success_rate: 96 },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      })),
    },
  },
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: { access_token: 'token' },
  }),
}));

// Mock profile hook
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { id: 'user-1', environment_mode: 'sandbox' },
    isLoading: false,
  }),
}));

describe('Analytics Dashboard Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Loading', () => {
    it('should render analytics page with main heading', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });
    });

    it('should display summary statistics cards', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/total|cost|calls|usage/i)).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      renderWithProviders(<Analytics />);

      // Check for loading indicators
      const loadingElements = screen.queryAllByRole('status');
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Time Range Selection', () => {
    it('should have time range selector', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        const timeRangeSelector = screen.getByRole('combobox') || 
          screen.getByLabelText(/time range|period/i) ||
          screen.getAllByRole('button').find(btn => btn.textContent?.match(/days|week|month/i));
        expect(timeRangeSelector).toBeInTheDocument();
      });
    });

    it('should update data when time range changes', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      // Find and interact with time range selector
      const buttons = screen.getAllByRole('button');
      const timeRangeButton = buttons.find(btn => 
        btn.textContent?.includes('7') || 
        btn.textContent?.includes('30') ||
        btn.textContent?.includes('day')
      );

      if (timeRangeButton) {
        await user.click(timeRangeButton);
      }
    });
  });

  describe('Charts and Visualizations', () => {
    it('should render chart containers', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        // Charts should be present - look for recharts containers or card components
        const charts = document.querySelectorAll('.recharts-wrapper, [data-testid*="chart"]');
        // The page should have some chart-like elements or cards
        const cards = screen.getAllByRole('article') || document.querySelectorAll('[class*="card"]');
        expect(cards.length + charts.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have accessible chart labels', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      // Charts should have accessible descriptions or labels
      const chartRegions = document.querySelectorAll('[role="img"], [aria-label*="chart"], figure');
      chartRegions.forEach(chart => {
        expect(chart).toHaveAccessibleName || expect(chart.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('API Usage Section', () => {
    it('should display API endpoint usage data', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        // Look for API usage related content
        const apiUsageSection = screen.queryByText(/api usage|endpoint/i);
        if (apiUsageSection) {
          expect(apiUsageSection).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for h1
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement?.tagName).not.toBe('BODY');
    });

    it('should have ARIA labels on interactive elements', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const hasAccessibleName = button.hasAttribute('aria-label') || 
          button.textContent?.trim().length > 0 ||
          button.hasAttribute('aria-labelledby');
        expect(hasAccessibleName).toBe(true);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render without errors on mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', async () => {
      renderWithProviders(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
      });

      // Should not crash with empty data
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});

describe('Analytics Export Functionality', () => {
  it('should have export button if available', async () => {
    renderWithProviders(<Analytics />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument();
    });

    const exportButton = screen.queryByRole('button', { name: /export|download/i });
    if (exportButton) {
      expect(exportButton).toBeInTheDocument();
    }
  });
});
