import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import Analytics from '../Analytics';
import { useAuth } from '@/contexts/AuthContext';
import { useEnvironmentMode } from '@/hooks/useProfile';
import { useApiUsage } from '@/hooks/useApiUsage';
import {
  useAnalyticsSummary,
  useDailySpending,
  useCostByEndpoint,
  useHourlyDistribution,
} from '@/hooks/useAnalytics';

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useProfile');
vi.mock('@/hooks/useApiUsage');
vi.mock('@/hooks/useAnalytics');

describe('Analytics', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useEnvironmentMode as any).mockReturnValue({ data: 'sandbox' });
    (useApiUsage as any).mockReturnValue({ data: [] });
    (useDailySpending as any).mockReturnValue({ data: [] });
    (useCostByEndpoint as any).mockReturnValue({ data: [] });
    (useHourlyDistribution as any).mockReturnValue({ data: [] });
  });

  it('should render loading state', () => {
    (useAnalyticsSummary as any).mockReturnValue({ 
      data: null, 
      isLoading: true 
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should render analytics page with data', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByText('Usage Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track spending, patterns, and performance')).toBeInTheDocument();
  });

  it('should display summary cards with correct data', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByText('Total API Calls')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('$25.50')).toBeInTheDocument();
  });

  it('should change time range when selector is used', async () => {
    const user = userEvent.setup();
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    // Open time range selector
    const selector = screen.getByRole('combobox');
    await user.click(selector);

    // Select 7 days
    const sevenDaysOption = screen.getByText('Last 7 Days');
    await user.click(sevenDaysOption);

    // Should trigger re-render with new time range
    await waitFor(() => {
      expect(useAnalyticsSummary).toHaveBeenCalledWith(mockUser.id, '7');
    });
  });

  it('should render tab sections', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /patterns/i })).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    const patternsTab = screen.getByRole('tab', { name: /patterns/i });
    await user.click(patternsTab);

    // Patterns tab should be active
    expect(patternsTab).toHaveAttribute('data-state', 'active');
  });

  it('should display daily spending chart', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    (useDailySpending as any).mockReturnValue({
      data: [
        { date: '2024-01-01', cost: 5.5, calls: 100 },
        { date: '2024-01-02', cost: 7.2, calls: 150 },
      ],
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByText('Daily Spending')).toBeInTheDocument();
  });

  it('should display cost by endpoint chart', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    (useCostByEndpoint as any).mockReturnValue({
      data: [
        { endpoint: 'run-comparison', cost: 15.5, calls: 800 },
        { endpoint: 'generate-prompt', cost: 10.0, calls: 700 },
      ],
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByText('Cost by Endpoint')).toBeInTheDocument();
  });

  it('should display API call patterns', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    (useApiUsage as any).mockReturnValue({
      data: [
        { endpoint_name: 'run-comparison', total_calls: 800 },
        { endpoint_name: 'generate-prompt', total_calls: 700 },
      ],
    });

    renderWithProviders(<Analytics />);

    // Switch to patterns tab
    const patternsTab = screen.getByRole('tab', { name: /patterns/i });
    patternsTab.click();

    expect(screen.getByText('API Call Patterns')).toBeInTheDocument();
  });

  it('should have responsive grid layout', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    const { container } = renderWithProviders(<Analytics />);

    // Check for responsive classes
    const gridElements = container.querySelectorAll('[class*="grid-cols"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should include navigation component', () => {
    (useAnalyticsSummary as any).mockReturnValue({
      data: {
        totalCalls: 1500,
        totalCost: 25.5,
        avgLatency: 450,
        avgCost: 0.017,
      },
      isLoading: false,
    });

    renderWithProviders(<Analytics />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
