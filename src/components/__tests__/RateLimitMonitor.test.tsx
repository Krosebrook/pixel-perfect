import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { RateLimitMonitor } from '../RateLimitMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { useEnvironmentMode } from '@/hooks/useProfile';
import { useRateLimitConfig, useRateLimitUsage } from '@/hooks/useRateLimits';
import type { RateLimitUsage } from '@/types/api';

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useProfile');
vi.mock('@/hooks/useRateLimits');

describe('RateLimitMonitor', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useEnvironmentMode as any).mockReturnValue({ data: 'sandbox' });
    (useRateLimitConfig as any).mockReturnValue({ data: [] });
  });

  it('should not render when no rate limit data', () => {
    (useRateLimitUsage as any).mockReturnValue({ data: [] });

    const { container } = renderWithProviders(<RateLimitMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when rate limit data is undefined', () => {
    (useRateLimitUsage as any).mockReturnValue({ data: undefined });

    const { container } = renderWithProviders(<RateLimitMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it('should display rate limit data for single endpoint', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 3, limit: 10, resetIn: 30000 },
        hour: { used: 30, limit: 100, resetIn: 1800000 },
        day: { used: 250, limit: 1000, resetIn: 43200000 },
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText('Rate Limit Monitor')).toBeInTheDocument();
    expect(screen.getByText(/sandbox mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Run Comparison/i)).toBeInTheDocument();
  });

  it('should show green status for low usage (under 70%)', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'generate-prompt',
        minute: { used: 3, limit: 10, resetIn: 30000 }, // 30%
        hour: { used: 30, limit: 100, resetIn: 1800000 }, // 30%
        day: { used: 250, limit: 1000, resetIn: 43200000 }, // 25%
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    const usageTexts = screen.getAllByText(/3 \/ 10|30 \/ 100|250 \/ 1000/);
    expect(usageTexts.length).toBeGreaterThan(0);
  });

  it('should show "Near Limit" badge for high usage (over 90%)', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 9, limit: 10, resetIn: 30000 }, // 90%
        hour: { used: 95, limit: 100, resetIn: 1800000 }, // 95%
        day: { used: 950, limit: 1000, resetIn: 43200000 }, // 95%
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText('Near Limit')).toBeInTheDocument();
  });

  it('should display multiple endpoints', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 5, limit: 10, resetIn: 30000 },
        hour: { used: 45, limit: 100, resetIn: 1800000 },
        day: { used: 400, limit: 1000, resetIn: 43200000 },
      },
      {
        endpoint: 'generate-prompt',
        minute: { used: 2, limit: 5, resetIn: 30000 },
        hour: { used: 20, limit: 50, resetIn: 1800000 },
        day: { used: 150, limit: 500, resetIn: 43200000 },
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText(/Run Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Prompt/i)).toBeInTheDocument();
  });

  it('should display reset timers', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 5, limit: 10, resetIn: 30000 }, // 30 seconds
        hour: { used: 45, limit: 100, resetIn: 3600000 }, // 1 hour
        day: { used: 400, limit: 1000, resetIn: 86400000 }, // 24 hours
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText(/Resets in 30s/i)).toBeInTheDocument();
    expect(screen.getByText(/Resets in 1h 0m/i)).toBeInTheDocument();
    expect(screen.getByText(/Resets in 24h 0m/i)).toBeInTheDocument();
  });

  it('should display per minute, per hour, and per day sections', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 5, limit: 10, resetIn: 30000 },
        hour: { used: 45, limit: 100, resetIn: 1800000 },
        day: { used: 400, limit: 1000, resetIn: 43200000 },
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText('Per Minute')).toBeInTheDocument();
    expect(screen.getByText('Per Hour')).toBeInTheDocument();
    expect(screen.getByText('Per Day')).toBeInTheDocument();
  });

  it('should show correct usage numbers', () => {
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 7, limit: 10, resetIn: 30000 },
        hour: { used: 63, limit: 100, resetIn: 1800000 },
        day: { used: 789, limit: 1000, resetIn: 43200000 },
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText(/7 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText(/63 \/ 100/)).toBeInTheDocument();
    expect(screen.getByText(/789 \/ 1000/)).toBeInTheDocument();
  });

  it('should display environment mode correctly', () => {
    (useEnvironmentMode as any).mockReturnValue({ data: 'production' });
    const mockData: RateLimitUsage[] = [
      {
        endpoint: 'run-comparison',
        minute: { used: 1, limit: 10, resetIn: 30000 },
        hour: { used: 10, limit: 100, resetIn: 1800000 },
        day: { used: 100, limit: 1000, resetIn: 43200000 },
      },
    ];
    (useRateLimitUsage as any).mockReturnValue({ data: mockData });

    renderWithProviders(<RateLimitMonitor />);

    expect(screen.getByText(/production mode/i)).toBeInTheDocument();
  });
});
