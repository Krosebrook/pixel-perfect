/**
 * @fileoverview Storybook stories for IncidentList component.
 * Documents incident display states and severity levels.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { IncidentList } from './IncidentList';
import type { DeploymentIncident } from '@/types/deployment';

const meta: Meta<typeof IncidentList> = {
  title: 'Deployment/IncidentList',
  component: IncidentList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create mock incidents
const createMockIncident = (
  id: string,
  type: string,
  severity: string,
  hoursAgo: number,
  resolved: boolean = false
): DeploymentIncident => ({
  id,
  deployment_id: `deploy-${id}`,
  incident_type: type,
  severity,
  detected_at: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
  resolved_at: resolved 
    ? new Date(Date.now() - (hoursAgo - 0.5) * 60 * 60 * 1000).toISOString() 
    : null,
  resolution_time_minutes: resolved ? 30 : null,
  failed_checks: type === 'health_check_failure' ? ['api', 'database'] : null,
  resolution_notes: resolved ? 'Issue resolved by automatic rollback' : null,
  github_issue_number: null,
  github_issue_url: null,
});

const mockIncidents: DeploymentIncident[] = [
  createMockIncident('1', 'health_check_failure', 'high', 2, false),
  createMockIncident('2', 'rollback_triggered', 'medium', 5, true),
  createMockIncident('3', 'build_failure', 'low', 8, true),
  createMockIncident('4', 'timeout', 'medium', 12, true),
  createMockIncident('5', 'health_check_failure', 'critical', 24, true),
];

/**
 * Default state with mixed incident types and severities.
 */
export const Default: Story = {
  args: {
    incidents: mockIncidents,
  },
};

/**
 * Active incidents - unresolved issues requiring attention.
 */
export const ActiveIncidents: Story = {
  args: {
    incidents: [
      createMockIncident('1', 'health_check_failure', 'critical', 0.5, false),
      createMockIncident('2', 'performance_degradation', 'high', 1, false),
      createMockIncident('3', 'error_rate_spike', 'medium', 2, false),
    ],
  },
};

/**
 * All resolved - no active incidents.
 */
export const AllResolved: Story = {
  args: {
    incidents: [
      createMockIncident('1', 'health_check_failure', 'high', 5, true),
      createMockIncident('2', 'rollback_triggered', 'medium', 10, true),
      createMockIncident('3', 'build_failure', 'low', 15, true),
    ],
  },
};

/**
 * Critical incidents - high severity issues.
 */
export const CriticalIncidents: Story = {
  args: {
    incidents: [
      createMockIncident('1', 'service_outage', 'critical', 0.25, false),
      createMockIncident('2', 'database_failure', 'critical', 1, false),
      createMockIncident('3', 'security_breach', 'critical', 2, true),
    ],
  },
};

/**
 * Empty state - no incidents recorded.
 */
export const Empty: Story = {
  args: {
    incidents: [],
  },
};

/**
 * Undefined incidents - loading state.
 */
export const Undefined: Story = {
  args: {
    incidents: undefined,
  },
};

/**
 * Single incident - minimal list.
 */
export const SingleIncident: Story = {
  args: {
    incidents: [
      createMockIncident('1', 'health_check_failure', 'medium', 1, false),
    ],
  },
};

/**
 * Various severity levels displayed together.
 */
export const AllSeverities: Story = {
  args: {
    incidents: [
      createMockIncident('1', 'service_outage', 'critical', 1, false),
      createMockIncident('2', 'health_check_failure', 'high', 2, false),
      createMockIncident('3', 'performance_degradation', 'medium', 3, false),
      createMockIncident('4', 'warning', 'low', 4, false),
    ],
  },
};
