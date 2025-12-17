/**
 * @fileoverview Storybook stories for DeploymentSummaryCards component.
 * Documents different data states and loading scenarios.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DeploymentSummaryCards } from './DeploymentSummaryCards';

const meta: Meta<typeof DeploymentSummaryCards> = {
  title: 'Deployment/DeploymentSummaryCards',
  component: DeploymentSummaryCards,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with typical deployment statistics.
 */
export const Default: Story = {
  args: {
    stats: {
      success_rate: 92.5,
      successful_deployments: 185,
      total_deployments: 200,
      rollback_count: 8,
      avg_deployment_duration_seconds: 180,
      avg_resolution_time_minutes: 25,
      resolved_incidents: 12,
      total_incidents: 15,
    },
  },
};

/**
 * High success rate scenario - ideal deployment health.
 */
export const HighSuccessRate: Story = {
  args: {
    stats: {
      success_rate: 99.5,
      successful_deployments: 199,
      total_deployments: 200,
      rollback_count: 1,
      avg_deployment_duration_seconds: 120,
      avg_resolution_time_minutes: 10,
      resolved_incidents: 2,
      total_incidents: 2,
    },
  },
};

/**
 * Low success rate scenario - indicates deployment issues.
 */
export const LowSuccessRate: Story = {
  args: {
    stats: {
      success_rate: 65.0,
      successful_deployments: 130,
      total_deployments: 200,
      rollback_count: 35,
      avg_deployment_duration_seconds: 300,
      avg_resolution_time_minutes: 90,
      resolved_incidents: 20,
      total_incidents: 45,
    },
  },
};

/**
 * Empty state - when no deployment data is available.
 */
export const EmptyData: Story = {
  args: {
    stats: undefined,
  },
};

/**
 * Partial data - some metrics are available.
 */
export const PartialData: Story = {
  args: {
    stats: {
      success_rate: 85.0,
      successful_deployments: 85,
      total_deployments: 100,
    },
  },
};

/**
 * Zero deployments - fresh project with no history.
 */
export const ZeroDeployments: Story = {
  args: {
    stats: {
      success_rate: 0,
      successful_deployments: 0,
      total_deployments: 0,
      rollback_count: 0,
      avg_deployment_duration_seconds: 0,
      avg_resolution_time_minutes: 0,
      resolved_incidents: 0,
      total_incidents: 0,
    },
  },
};

/**
 * Long duration deployments - shows minutes correctly.
 */
export const LongDurations: Story = {
  args: {
    stats: {
      success_rate: 88.0,
      successful_deployments: 88,
      total_deployments: 100,
      rollback_count: 5,
      avg_deployment_duration_seconds: 900, // 15 minutes
      avg_resolution_time_minutes: 180, // 3 hours
      resolved_incidents: 8,
      total_incidents: 10,
    },
  },
};
