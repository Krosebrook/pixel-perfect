import type { Meta, StoryObj } from '@storybook/react';
import Settings from './Settings';
import { withProviders, withAuth } from '../../.storybook/decorators';

const meta: Meta<typeof Settings> = {
  title: 'Pages/Settings',
  component: Settings,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Settings>;

export const Default: Story = {
  parameters: {
    mockData: {
      profile: {
        id: 'user-1',
        display_name: 'John Doe',
        avatar_url: null,
        bio: 'AI enthusiast and prompt engineer',
        environment_mode: 'sandbox',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      budget: {
        monthly_budget: 100,
        daily_limit: 10,
        current_spending: 45.5,
        alert_threshold: 0.8,
        email_notifications_enabled: true,
        notification_email: 'john@example.com',
      },
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      profile: null,
      budget: null,
      isLoading: true,
    },
  },
};

export const ProductionMode: Story = {
  parameters: {
    mockData: {
      profile: {
        id: 'user-1',
        display_name: 'Jane Smith',
        avatar_url: null,
        bio: null,
        environment_mode: 'production',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      budget: {
        monthly_budget: 500,
        daily_limit: 50,
        current_spending: 245.75,
        alert_threshold: 0.85,
        email_notifications_enabled: true,
        notification_email: 'jane@company.com',
      },
    },
  },
};

export const NoBudgetConfigured: Story = {
  parameters: {
    mockData: {
      profile: {
        id: 'user-1',
        display_name: 'New User',
        avatar_url: null,
        bio: null,
        environment_mode: 'sandbox',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      budget: null,
    },
  },
};

export const HighUsage: Story = {
  parameters: {
    mockData: {
      profile: {
        id: 'user-1',
        display_name: 'Power User',
        avatar_url: null,
        bio: 'Heavy API user',
        environment_mode: 'production',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      budget: {
        monthly_budget: 1000,
        daily_limit: 100,
        current_spending: 875,
        alert_threshold: 0.8,
        email_notifications_enabled: true,
        notification_email: 'power@example.com',
      },
      rateLimitUsage: [
        {
          endpoint: 'run-comparison',
          minute: { used: 8, limit: 10, resetIn: 30000 },
          hour: { used: 85, limit: 100, resetIn: 1800000 },
          day: { used: 900, limit: 1000, resetIn: 43200000 },
        },
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

export const DarkMode: Story = {
  ...Default,
  parameters: {
    ...Default.parameters,
    theme: 'dark',
  },
};

export const NotificationsDisabled: Story = {
  parameters: {
    mockData: {
      profile: {
        id: 'user-1',
        display_name: 'Silent User',
        avatar_url: null,
        bio: null,
        environment_mode: 'sandbox',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      budget: {
        monthly_budget: 100,
        daily_limit: 10,
        current_spending: 25,
        alert_threshold: 0.8,
        email_notifications_enabled: false,
        notification_email: null,
      },
    },
  },
};
