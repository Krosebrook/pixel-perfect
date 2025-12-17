/**
 * @fileoverview Storybook stories for DeploymentList component.
 * Documents various list states and deployment scenarios.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DeploymentList } from './DeploymentList';
import type { DeploymentMetric } from '@/types/deployment';

const meta: Meta<typeof DeploymentList> = {
  title: 'Deployment/DeploymentList',
  component: DeploymentList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to generate mock deployments
const createMockDeployment = (
  id: string,
  status: string,
  hoursAgo: number,
  options?: Partial<DeploymentMetric>
): DeploymentMetric => ({
  id,
  commit_sha: `abc${id}def1234567890`,
  deployment_type: 'production',
  status,
  started_at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
  completed_at: new Date(Date.now() - (hoursAgo - 0.05) * 60 * 60 * 1000).toISOString(),
  duration_seconds: 180,
  workflow_run_id: `run-${id}`,
  created_at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
  health_check_status: null,
  deployment_url: null,
  error_message: null,
  ...options,
});

const mockDeployments: DeploymentMetric[] = [
  createMockDeployment('1', 'success', 1, { 
    health_check_status: 'healthy',
    deployment_url: 'https://app.example.com' 
  }),
  createMockDeployment('2', 'success', 3, { 
    deployment_url: 'https://app.example.com' 
  }),
  createMockDeployment('3', 'failed', 5, { 
    error_message: 'Build failed: dependency resolution error' 
  }),
  createMockDeployment('4', 'rolled_back', 8, { 
    health_check_status: 'unhealthy' 
  }),
  createMockDeployment('5', 'success', 12, { 
    deployment_url: 'https://app.example.com' 
  }),
];

/**
 * Default state with mixed deployment statuses.
 */
export const Default: Story = {
  args: {
    deployments: mockDeployments,
  },
};

/**
 * All successful deployments - healthy deployment pipeline.
 */
export const AllSuccessful: Story = {
  args: {
    deployments: [
      createMockDeployment('1', 'success', 1, { 
        health_check_status: 'healthy',
        deployment_url: 'https://app.example.com' 
      }),
      createMockDeployment('2', 'success', 3, { 
        health_check_status: 'healthy',
        deployment_url: 'https://app.example.com' 
      }),
      createMockDeployment('3', 'success', 6, { 
        health_check_status: 'healthy',
        deployment_url: 'https://app.example.com' 
      }),
    ],
  },
};

/**
 * Multiple failures - indicates deployment issues.
 */
export const MultipleFailures: Story = {
  args: {
    deployments: [
      createMockDeployment('1', 'failed', 1, { 
        error_message: 'Test suite failed' 
      }),
      createMockDeployment('2', 'rolled_back', 2, { 
        health_check_status: 'unhealthy' 
      }),
      createMockDeployment('3', 'failed', 3, { 
        error_message: 'Build timeout' 
      }),
      createMockDeployment('4', 'success', 5, { 
        deployment_url: 'https://app.example.com' 
      }),
    ],
  },
};

/**
 * Empty state - no deployments recorded.
 */
export const Empty: Story = {
  args: {
    deployments: [],
  },
};

/**
 * Undefined deployments - loading or error state.
 */
export const Undefined: Story = {
  args: {
    deployments: undefined,
  },
};

/**
 * Single deployment - minimal list.
 */
export const SingleDeployment: Story = {
  args: {
    deployments: [
      createMockDeployment('1', 'success', 0.5, { 
        health_check_status: 'healthy',
        deployment_url: 'https://app.example.com' 
      }),
    ],
  },
};

/**
 * Deployments without URLs - no view links shown.
 */
export const NoUrls: Story = {
  args: {
    deployments: [
      createMockDeployment('1', 'success', 1),
      createMockDeployment('2', 'success', 3),
      createMockDeployment('3', 'failed', 5),
    ],
  },
};

/**
 * Long durations - shows time formatting correctly.
 */
export const LongDurations: Story = {
  args: {
    deployments: [
      createMockDeployment('1', 'success', 1, { 
        duration_seconds: 600, // 10 minutes
        deployment_url: 'https://app.example.com' 
      }),
      createMockDeployment('2', 'success', 5, { 
        duration_seconds: 1200, // 20 minutes
        deployment_url: 'https://app.example.com' 
      }),
    ],
  },
};
