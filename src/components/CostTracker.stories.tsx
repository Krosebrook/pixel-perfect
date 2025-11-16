import type { Meta, StoryObj } from '@storybook/react';
import { CostTracker } from './CostTracker';
import { withProviders, withAuth } from '../../.storybook/decorators';

const meta: Meta<typeof CostTracker> = {
  title: 'Components/CostTracker',
  component: CostTracker,
  decorators: [withAuth, withProviders],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof CostTracker>;

export const Default: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 100,
        current_spending: 45.5,
        alert_threshold: 0.8,
      },
    },
  },
};

export const Warning: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 100,
        current_spending: 85,
        alert_threshold: 0.8,
      },
    },
  },
};

export const OverBudget: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 100,
        current_spending: 115,
        alert_threshold: 0.8,
      },
    },
  },
};

export const NoBudgetSet: Story = {
  parameters: {
    mockData: {
      budget: null,
    },
  },
};

export const Loading: Story = {
  parameters: {
    mockData: {
      budget: null,
      isLoading: true,
    },
  },
};

export const LowUsage: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 200,
        current_spending: 25,
        alert_threshold: 0.8,
      },
    },
  },
};

export const HighBudget: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 1000,
        current_spending: 650,
        alert_threshold: 0.7,
      },
    },
  },
};

export const ZeroSpending: Story = {
  parameters: {
    mockData: {
      budget: {
        monthly_budget: 100,
        current_spending: 0,
        alert_threshold: 0.8,
      },
    },
  },
};
