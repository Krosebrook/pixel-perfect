import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  success: 'default',
  failed: 'destructive',
  rolled_back: 'secondary',
  pending: 'outline',
};

/**
 * Renders an icon for the given deployment status
 */
export function DeploymentStatusIcon({ status }: { status: string }) {
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
 * Renders a badge for the given deployment status
 */
export function DeploymentStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] || 'outline'}>{status}</Badge>;
}
