import type { Meta, StoryObj } from '@storybook/react';
import Analytics from './Analytics';
import { withProviders, withAuth } from '../../.storybook/decorators';

const meta: Meta<typeof Analytics> = {
  title: 'Pages/Analytics',
  component: Analytics,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Analytics>;

const mockFullData = {
  summaryStats: {
    totalCalls: 1500,
    totalCost: 125.50,
    avgLatency: 450,
    avgCost: 0.084,
  },
  dailySpending: [
    { date: '2024-01-01', cost: 15.5, calls: 180 },
    { date: '2024-01-02', cost: 12.3, calls: 145 },
    { date: '2024-01-03', cost: 18.7, calls: 220 },
    { date: '2024-01-04', cost: 14.2, calls: 170 },
    { date: '2024-01-05', cost: 20.1, calls: 240 },
    { date: '2024-01-06', cost: 16.8, calls: 195 },
    { date: '2024-01-07', cost: 22.4, calls: 265 },
  ],
  costByEndpoint: [
    { endpoint: 'run-comparison', cost: 65.5, calls: 800 },
    { endpoint: 'generate-prompt', cost: 42.0, calls: 500 },
    { endpoint: 'validate-quality', cost: 18.0, calls: 200 },
  ],
  hourlyDistribution: [
    { hour: '00:00', calls: 25 },
    { hour: '03:00', calls: 15 },
    { hour: '06:00', calls: 45 },
    { hour: '09:00', calls: 120 },
    { hour: '12:00', calls: 180 },
    { hour: '15:00', calls: 200 },
    { hour: '18:00', calls: 150 },
    { hour: '21:00', calls: 80 },
  ],
  apiUsage: [
    { endpoint_name: 'run-comparison', total_calls: 800 },
    { endpoint_name: 'generate-prompt', total_calls: 500 },
    { endpoint_name: 'validate-quality', total_calls: 200 },
  ],
};

export const Default: Story = {
  parameters: {
    mockData: mockFullData,
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      summaryStats: null,
      isLoading: true,
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    mockData: {
      summaryStats: {
        totalCalls: 0,
        totalCost: 0,
        avgLatency: 0,
        avgCost: 0,
      },
      dailySpending: [],
      costByEndpoint: [],
      hourlyDistribution: [],
      apiUsage: [],
    },
  },
};

export const SevenDaysRange: Story = {
  parameters: {
    mockData: {
      ...mockFullData,
      timeRange: '7',
    },
  },
};

export const NinetyDaysRange: Story = {
  parameters: {
    mockData: {
      summaryStats: {
        totalCalls: 12500,
        totalCost: 1250.75,
        avgLatency: 425,
        avgCost: 0.100,
      },
      dailySpending: Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        cost: Math.random() * 50 + 10,
        calls: Math.floor(Math.random() * 300) + 100,
      })),
      costByEndpoint: [
        { endpoint: 'run-comparison', cost: 650.5, calls: 6500 },
        { endpoint: 'generate-prompt', cost: 420.0, calls: 4200 },
        { endpoint: 'validate-quality', cost: 180.25, calls: 1800 },
      ],
      hourlyDistribution: [
        { hour: '00:00', calls: 250 },
        { hour: '03:00', calls: 150 },
        { hour: '06:00', calls: 450 },
        { hour: '09:00', calls: 1200 },
        { hour: '12:00', calls: 1800 },
        { hour: '15:00', calls: 2000 },
        { hour: '18:00', calls: 1500 },
        { hour: '21:00', calls: 800 },
      ],
      apiUsage: [
        { endpoint_name: 'run-comparison', total_calls: 6500 },
        { endpoint_name: 'generate-prompt', total_calls: 4200 },
        { endpoint_name: 'validate-quality', total_calls: 1800 },
      ],
      timeRange: '90',
    },
  },
};

export const HighUsagePeriod: Story = {
  parameters: {
    mockData: {
      summaryStats: {
        totalCalls: 5000,
        totalCost: 450.00,
        avgLatency: 520,
        avgCost: 0.090,
      },
      dailySpending: [
        { date: '2024-01-01', cost: 55.5, calls: 580 },
        { date: '2024-01-02', cost: 62.3, calls: 645 },
        { date: '2024-01-03', cost: 58.7, calls: 620 },
        { date: '2024-01-04', cost: 64.2, calls: 670 },
        { date: '2024-01-05', cost: 70.1, calls: 740 },
        { date: '2024-01-06', cost: 66.8, calls: 695 },
        { date: '2024-01-07', cost: 72.4, calls: 765 },
      ],
      costByEndpoint: [
        { endpoint: 'run-comparison', cost: 250.0, calls: 2800 },
        { endpoint: 'generate-prompt', cost: 150.0, calls: 1700 },
        { endpoint: 'validate-quality', cost: 50.0, calls: 500 },
      ],
      hourlyDistribution: [
        { hour: '00:00', calls: 125 },
        { hour: '03:00', calls: 85 },
        { hour: '06:00', calls: 245 },
        { hour: '09:00', calls: 620 },
        { hour: '12:00', calls: 880 },
        { hour: '15:00', calls: 1000 },
        { hour: '18:00', calls: 750 },
        { hour: '21:00', calls: 380 },
      ],
      apiUsage: [
        { endpoint_name: 'run-comparison', total_calls: 2800 },
        { endpoint_name: 'generate-prompt', total_calls: 1700 },
        { endpoint_name: 'validate-quality', total_calls: 500 },
      ],
    },
  },
};

export const LowUsagePeriod: Story = {
  parameters: {
    mockData: {
      summaryStats: {
        totalCalls: 250,
        totalCost: 12.50,
        avgLatency: 380,
        avgCost: 0.050,
      },
      dailySpending: [
        { date: '2024-01-01', cost: 1.5, calls: 30 },
        { date: '2024-01-02', cost: 2.3, calls: 45 },
        { date: '2024-01-03', cost: 1.7, calls: 35 },
        { date: '2024-01-04', cost: 2.2, calls: 40 },
        { date: '2024-01-05', cost: 1.1, calls: 25 },
        { date: '2024-01-06', cost: 1.8, calls: 38 },
        { date: '2024-01-07', cost: 1.9, calls: 37 },
      ],
      costByEndpoint: [
        { endpoint: 'run-comparison', cost: 6.5, calls: 130 },
        { endpoint: 'generate-prompt', cost: 4.0, calls: 80 },
        { endpoint: 'validate-quality', cost: 2.0, calls: 40 },
      ],
      hourlyDistribution: [
        { hour: '00:00', calls: 5 },
        { hour: '03:00', calls: 3 },
        { hour: '06:00', calls: 12 },
        { hour: '09:00', calls: 35 },
        { hour: '12:00', calls: 50 },
        { hour: '15:00', calls: 55 },
        { hour: '18:00', calls: 42 },
        { hour: '21:00', calls: 18 },
      ],
      apiUsage: [
        { endpoint_name: 'run-comparison', total_calls: 130 },
        { endpoint_name: 'generate-prompt', total_calls: 80 },
        { endpoint_name: 'validate-quality', total_calls: 40 },
      ],
    },
  },
};

export const SingleEndpointUsage: Story = {
  parameters: {
    mockData: {
      summaryStats: {
        totalCalls: 800,
        totalCost: 65.50,
        avgLatency: 410,
        avgCost: 0.082,
      },
      dailySpending: [
        { date: '2024-01-01', cost: 8.5, calls: 100 },
        { date: '2024-01-02', cost: 9.3, calls: 115 },
        { date: '2024-01-03', cost: 10.7, calls: 130 },
        { date: '2024-01-04', cost: 9.2, calls: 110 },
        { date: '2024-01-05', cost: 11.1, calls: 135 },
        { date: '2024-01-06', cost: 8.8, calls: 105 },
        { date: '2024-01-07', cost: 7.9, calls: 105 },
      ],
      costByEndpoint: [
        { endpoint: 'run-comparison', cost: 65.5, calls: 800 },
      ],
      hourlyDistribution: [
        { hour: '00:00', calls: 15 },
        { hour: '03:00', calls: 10 },
        { hour: '06:00', calls: 35 },
        { hour: '09:00', calls: 95 },
        { hour: '12:00', calls: 140 },
        { hour: '15:00', calls: 180 },
        { hour: '18:00', calls: 120 },
        { hour: '21:00', calls: 65 },
      ],
      apiUsage: [
        { endpoint_name: 'run-comparison', total_calls: 800 },
      ],
    },
  },
};

export const MobileView: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
