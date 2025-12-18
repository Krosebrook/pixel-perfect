import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Shield, LogIn, LogOut, Key, AlertTriangle, UserCheck, Filter, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const activityIcons: Record<string, React.ElementType> = {
  sign_in: LogIn,
  sign_out: LogOut,
  mfa_enabled: Shield,
  mfa_disabled: Shield,
  password_change: Key,
  recovery_code_used: AlertTriangle,
  session_revoked: LogOut,
  profile_updated: UserCheck,
};

const activityColors: Record<string, string> = {
  sign_in: 'bg-green-500/10 text-green-500',
  sign_out: 'bg-muted text-muted-foreground',
  mfa_enabled: 'bg-blue-500/10 text-blue-500',
  mfa_disabled: 'bg-orange-500/10 text-orange-500',
  password_change: 'bg-yellow-500/10 text-yellow-500',
  recovery_code_used: 'bg-red-500/10 text-red-500',
  session_revoked: 'bg-orange-500/10 text-orange-500',
  profile_updated: 'bg-muted text-muted-foreground',
};

interface ActivityWithProfile {
  id: string;
  user_id: string;
  activity_type: string;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  metadata: unknown;
  created_at: string;
  display_name?: string | null;
}

export function SecurityAuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-audit-log', activityFilter],
    queryFn: async () => {
      let query = supabase
        .from('account_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for unique user IDs
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      return data.map(activity => ({
        ...activity,
        display_name: profileMap.get(activity.user_id) || null
      })) as ActivityWithProfile[];
    },
  });

  const filteredActivities = activities?.filter((activity) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const displayName = activity.display_name || '';
    return (
      activity.activity_type.toLowerCase().includes(searchLower) ||
      activity.ip_address?.toLowerCase().includes(searchLower) ||
      activity.location?.toLowerCase().includes(searchLower) ||
      displayName.toLowerCase().includes(searchLower) ||
      activity.user_id.toLowerCase().includes(searchLower)
    );
  });

  const activityTypes = [
    'sign_in',
    'sign_out',
    'mfa_enabled',
    'mfa_disabled',
    'password_change',
    'recovery_code_used',
    'session_revoked',
    'profile_updated',
  ];

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const exportToCSV = () => {
    if (!filteredActivities?.length) return;

    const headers = ['Timestamp', 'User', 'User ID', 'Activity Type', 'IP Address', 'Location', 'Device'];
    const rows = filteredActivities.map(activity => [
      format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss'),
      activity.display_name || 'Unknown User',
      activity.user_id,
      formatActivityType(activity.activity_type),
      activity.ip_address || '',
      activity.location || '',
      activity.user_agent || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
        </CardTitle>
        <CardDescription>
          View all account activity across the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, IP, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatActivityType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={!filteredActivities?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredActivities?.length || 0} of {activities?.length || 0} activities
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredActivities?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found matching your criteria
            </div>
          ) : (
            filteredActivities?.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || Shield;
              const colorClass = activityColors[activity.activity_type] || 'bg-muted text-muted-foreground';
              const displayName = activity.display_name;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {displayName || 'Unknown User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatActivityType(activity.activity_type)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <div className="truncate">User ID: {activity.user_id}</div>
                      {activity.ip_address && (
                        <div>IP: {activity.ip_address}</div>
                      )}
                      {activity.location && (
                        <div>Location: {activity.location}</div>
                      )}
                      {activity.user_agent && (
                        <div className="truncate">Device: {activity.user_agent}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
