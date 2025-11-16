import type { Meta, StoryObj } from '@storybook/react';
import { RateLimitMonitor } from './RateLimitMonitor';
import { withProviders, withAuth } from '../../.storybook/decorators';
import type { RateLimitUsage } from '@/types/api';

const meta: Meta<typeof RateLimitMonitor> = {
  title: 'Components/RateLimitMonitor',
  component: RateLimitMonitor,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof RateLimitMonitor>;

const mockNormalUsage: RateLimitUsage[] = [
  {
    endpoint: 'run-comparison',
    minute: { used: 3, limit: 10, resetIn: 30000 },
    hour: { used: 30, limit: 100, resetIn: 1800000 },
    day: { used: 250, limit: 1000, resetIn: 43200000 },
  },
];

const mockWarningUsage: RateLimitUsage[] = [
  {
    endpoint: 'run-comparison',
    minute: { used: 7, limit: 10, resetIn: 45000 },
    hour: { used: 75, limit: 100, resetIn: 2100000 },
    day: { used: 750, limit: 1000, resetIn: 50000000 },
  },
];

const mockDangerUsage: RateLimitUsage[] = [
  {
    endpoint: 'run-comparison',
    minute: { used: 9, limit: 10, resetIn: 15000 },
    hour: { used: 95, limit: 100, resetIn: 900000 },
    day: { used: 980, limit: 1000, resetIn: 10000000 },
  },
];

const mockMultipleEndpoints: RateLimitUsage[] = [
  {
    endpoint: 'run-comparison',
    minute: { used: 5, limit: 10, resetIn: 30000 },
    hour: { used: 45, limit: 100, resetIn: 1800000 },
    day: { used: 400, limit: 1000, resetIn: 43200000 },
  },
  {
    endpoint: 'generate-prompt',
    minute: { used: 2, limit: 5, resetIn: 40000 },
    hour: { used: 25, limit: 50, resetIn: 2000000 },
    day: { used: 200, limit: 500, resetIn: 45000000 },
  },
  {
    endpoint: 'validate-quality',
    minute: { used: 8, limit: 10, resetIn: 20000 },
    hour: { used: 80, limit: 100, resetIn: 1500000 },
    day: { used: 600, limit: 1000, resetIn: 40000000 },
  },
];

export const Default: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: mockNormalUsage,
      environmentMode: 'sandbox',
    },
  },
};

export const Warning: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: mockWarningUsage,
      environmentMode: 'sandbox',
    },
  },
};

export const Danger: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: mockDangerUsage,
      environmentMode: 'sandbox',
    },
  },
};

export const MultipleEndpoints: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: mockMultipleEndpoints,
      environmentMode: 'production',
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: [],
      environmentMode: 'sandbox',
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: undefined,
      environmentMode: 'sandbox',
      isLoading: true,
    },
  },
};

export const SingleEndpoint: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: [mockNormalUsage[0]],
      environmentMode: 'production',
    },
  },
};

export const AllTimeWindows: Story = {
  parameters: {
    mockData: {
      rateLimitUsage: [
        {
          endpoint: 'run-comparison',
          minute: { used: 5, limit: 10, resetIn: 30000 }, // 50%
          hour: { used: 75, limit: 100, resetIn: 1800000 }, // 75%
          day: { used: 950, limit: 1000, resetIn: 43200000 }, // 95%
        },
      ],
      environmentMode: 'sandbox',
    },
  },
};
