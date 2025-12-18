import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  Lock, 
  CheckCircle, 
  XCircle,
  Globe,
  Monitor,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  email: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const eventTypeConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login_success: { icon: <CheckCircle className="h-4 w-4" />, label: 'Login Success', variant: 'default' },
  login_failed: { icon: <XCircle className="h-4 w-4" />, label: 'Login Failed', variant: 'destructive' },
  account_locked: { icon: <Lock className="h-4 w-4" />, label: 'Account Locked', variant: 'destructive' },
  password_reset: { icon: <Shield className="h-4 w-4" />, label: 'Password Reset', variant: 'secondary' },
  mfa_enabled: { icon: <Shield className="h-4 w-4" />, label: 'MFA Enabled', variant: 'default' },
  mfa_disabled: { icon: <AlertTriangle className="h-4 w-4" />, label: 'MFA Disabled', variant: 'outline' },
  logout: { icon: <LogOut className="h-4 w-4" />, label: 'Logout', variant: 'secondary' },
};

export function SecurityAuditLogPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data: auditLogs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['security-audit-logs', user?.id, eventFilter, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('security_audit_log')
        .select('*')
        .gte('created_at', getDateFilter())
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredLogs = auditLogs?.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.email?.toLowerCase().includes(search) ||
      log.ip_address?.toLowerCase().includes(search) ||
      log.event_type.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: auditLogs?.length || 0,
    successful: auditLogs?.filter(l => l.event_type === 'login_success').length || 0,
    failed: auditLogs?.filter(l => l.event_type === 'login_failed').length || 0,
    locked: auditLogs?.filter(l => l.event_type === 'account_locked').length || 0,
  };

  const parseUserAgent = (ua: string | null): string => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor login attempts, security events, and account activity
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Successful Logins
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.successful}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed Attempts
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Lock className="h-4 w-4 text-orange-500" />
              Account Lockouts
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.locked}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, IP address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="login_success">Login Success</SelectItem>
                <SelectItem value="login_failed">Login Failed</SelectItem>
                <SelectItem value="account_locked">Account Locked</SelectItem>
                <SelectItem value="password_reset">Password Reset</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs?.length || 0} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const config = eventTypeConfig[log.event_type] || {
                      icon: <LogIn className="h-4 w-4" />,
                      label: log.event_type,
                      variant: 'outline' as const
                    };
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono">{log.ip_address || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Monitor className="h-3 w-3 text-muted-foreground" />
                            {parseUserAgent(log.user_agent)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <span className="text-muted-foreground">
                              {JSON.stringify(log.metadata)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No security events found</p>
              <p className="text-sm">Security events will appear here as they occur</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityAuditLogPage;
