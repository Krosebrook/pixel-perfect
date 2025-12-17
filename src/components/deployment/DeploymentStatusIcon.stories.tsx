/**
 * @fileoverview Storybook stories for DeploymentStatusIcon components.
 * Documents all visual states for deployment status indicators.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DeploymentStatusIcon, DeploymentStatusBadge } from './DeploymentStatusIcon';

const meta: Meta<typeof DeploymentStatusIcon> = {
  title: 'Deployment/DeploymentStatusIcon',
  component: DeploymentStatusIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'failed', 'rolled_back', 'pending'],
      description: 'The deployment status to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Success state - shown when deployment completed successfully.
 */
export const Success: Story = {
  args: {
    status: 'success',
  },
};

/**
 * Failed state - shown when deployment failed.
 */
export const Failed: Story = {
  args: {
    status: 'failed',
  },
};

/**
 * Rolled back state - shown when deployment was automatically rolled back.
 */
export const RolledBack: Story = {
  args: {
    status: 'rolled_back',
  },
};

/**
 * Pending state - shown when deployment is in progress.
 */
export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

/**
 * All status icons displayed together for comparison.
 */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <DeploymentStatusIcon status="success" />
        <span className="text-xs text-muted-foreground">Success</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DeploymentStatusIcon status="failed" />
        <span className="text-xs text-muted-foreground">Failed</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DeploymentStatusIcon status="rolled_back" />
        <span className="text-xs text-muted-foreground">Rolled Back</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DeploymentStatusIcon status="pending" />
        <span className="text-xs text-muted-foreground">Pending</span>
      </div>
    </div>
  ),
};

// Badge stories
const badgeMeta: Meta<typeof DeploymentStatusBadge> = {
  title: 'Deployment/DeploymentStatusBadge',
  component: DeploymentStatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export const BadgeSuccess: StoryObj<typeof DeploymentStatusBadge> = {
  render: () => <DeploymentStatusBadge status="success" />,
};

export const BadgeFailed: StoryObj<typeof DeploymentStatusBadge> = {
  render: () => <DeploymentStatusBadge status="failed" />,
};

export const BadgeRolledBack: StoryObj<typeof DeploymentStatusBadge> = {
  render: () => <DeploymentStatusBadge status="rolled_back" />,
};

export const BadgePending: StoryObj<typeof DeploymentStatusBadge> = {
  render: () => <DeploymentStatusBadge status="pending" />,
};

export const AllBadges: StoryObj<typeof DeploymentStatusBadge> = {
  render: () => (
    <div className="flex items-center gap-2">
      <DeploymentStatusBadge status="success" />
      <DeploymentStatusBadge status="failed" />
      <DeploymentStatusBadge status="rolled_back" />
      <DeploymentStatusBadge status="pending" />
    </div>
  ),
};
