import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  LogIn, 
  LogOut, 
  Shield, 
  Key, 
  AlertTriangle,
  Smartphone,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityRecord {
  id: string;
  activity_type: string;
  ip_address: string | null;
  user_agent: string | null;
  location: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  'sign_in': <LogIn className="h-4 w-4" />,
  'sign_out': <LogOut className="h-4 w-4" />,
  'password_change': <Key className="h-4 w-4" />,
  'mfa_enabled': <Shield className="h-4 w-4" />,
  'mfa_disabled': <Shield className="h-4 w-4" />,
  'failed_login': <AlertTriangle className="h-4 w-4" />,
  'session_revoked': <Smartphone className="h-4 w-4" />,
};

const activityLabels: Record<string, string> = {
  'sign_in': 'Signed in',
  'sign_out': 'Signed out',
  'password_change': 'Password changed',
  'mfa_enabled': '2FA enabled',
  'mfa_disabled': '2FA disabled',
  'failed_login': 'Failed login attempt',
  'session_revoked': 'Session revoked',
};

const activityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'sign_in': 'default',
  'sign_out': 'secondary',
  'password_change': 'outline',
  'mfa_enabled': 'default',
  'mfa_disabled': 'secondary',
  'failed_login': 'destructive',
  'session_revoked': 'secondary',
};

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';
  
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android device';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Linux')) return 'Linux';
  
  return 'Unknown device';
}

export function AccountActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('account_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setActivities(data as ActivityRecord[]);
      }
      setLoading(false);
    };

    fetchActivities();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Account Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Account Activity
        </CardTitle>
        <CardDescription>
          Recent sign-ins and security events on your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity to display
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {activityIcons[activity.activity_type] || <Globe className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={activityVariants[activity.activity_type] || 'outline'}>
                        {activityLabels[activity.activity_type] || activity.activity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {parseUserAgent(activity.user_agent)}
                      </p>
                      {activity.ip_address && (
                        <p className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {activity.ip_address}
                          {activity.location && ` • ${activity.location}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}