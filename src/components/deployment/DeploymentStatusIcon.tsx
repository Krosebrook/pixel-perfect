/**
 * @fileoverview Components for displaying deployment status indicators.
 * Provides consistent visual representation of deployment states.
 */

import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** Valid badge variants for deployment status */
type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/** Maps deployment status to badge variant */
const STATUS_VARIANTS: Record<string, StatusVariant> = {
  success: 'default',
  failed: 'destructive',
  rolled_back: 'secondary',
  pending: 'outline',
};

/**
 * Props for DeploymentStatusIcon component.
 */
interface DeploymentStatusIconProps {
  /** The deployment status to display */
  status: string;
}

/**
 * Renders an appropriate icon based on deployment status.
 * Uses semantic colors from the design system.
 * 
 * @param props - Component props
 * @param props.status - The deployment status ('success' | 'failed' | 'rolled_back' | 'pending')
 * @returns A Lucide icon component with appropriate styling
 * 
 * @example
 * <DeploymentStatusIcon status="success" />
 * <DeploymentStatusIcon status="failed" />
 */
export function DeploymentStatusIcon({ status }: DeploymentStatusIconProps) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'rolled_back':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

/**
 * Props for DeploymentStatusBadge component.
 */
interface DeploymentStatusBadgeProps {
  /** The deployment status to display */
  status: string;
}

/**
 * Renders a badge showing the deployment status with appropriate variant.
 * 
 * @param props - Component props
 * @param props.status - The deployment status string
 * @returns A styled Badge component
 * 
 * @example
 * <DeploymentStatusBadge status="success" />
 * <DeploymentStatusBadge status="rolled_back" />
 */
export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status] || 'outline'}>{status}</Badge>;
}
