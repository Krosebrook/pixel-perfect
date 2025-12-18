import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location?: string;
  lastActive: Date;
  isCurrent: boolean;
}

function parseUserAgent(ua: string): { device: string; browser: string } {
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';

  // Detect device
  if (ua.includes('iPhone')) device = 'iPhone';
  else if (ua.includes('iPad')) device = 'iPad';
  else if (ua.includes('Android') && ua.includes('Mobile')) device = 'Android Phone';
  else if (ua.includes('Android')) device = 'Android Tablet';
  else if (ua.includes('Macintosh')) device = 'Mac';
  else if (ua.includes('Windows')) device = 'Windows PC';
  else if (ua.includes('Linux')) device = 'Linux';

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return { device, browser };
}

function getDeviceIcon(device: string) {
  if (device.includes('Phone') || device.includes('iPhone') || device.includes('Android Phone')) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (device.includes('iPad') || device.includes('Tablet')) {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

export function SessionManager() {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = async () => {
    if (!user || !session) return;

    setLoading(true);
    
    // Get current session info
    const currentSession: SessionInfo = {
      id: session.access_token.substring(0, 16),
      ...parseUserAgent(navigator.userAgent),
      ip: 'Current IP',
      lastActive: new Date(),
      isCurrent: true,
    };

    // For demo purposes, we'll show just the current session
    // In a real implementation, you'd fetch sessions from Supabase
    setSessions([currentSession]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user, session]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    
    // In a real implementation, you'd call Supabase to revoke the session
    // For now, we'll simulate it
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    toast({
      title: "Session revoked",
      description: "The session has been successfully terminated."
    });
    
    setRevoking(null);
  };

  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    
    // Sign out from all other sessions
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    
    if (error) {
      toast({
        title: "Failed to revoke sessions",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "All other sessions revoked",
        description: "You have been signed out from all other devices."
      });
      
      // Keep only current session
      setSessions(prev => prev.filter(s => s.isCurrent));
    }
    
    setRevokingAll(false);
  };

  const handleSignOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast({
      title: "Signed out everywhere",
      description: "You have been signed out from all devices including this one."
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Devices where you're currently signed in
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((sessionItem) => (
          <div
            key={sessionItem.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                {getDeviceIcon(sessionItem.device)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sessionItem.device}</span>
                  {sessionItem.isCurrent && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sessionItem.browser} • Last active{' '}
                  {formatDistanceToNow(sessionItem.lastActive, { addSuffix: true })}
                </p>
              </div>
            </div>
            {!sessionItem.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeSession(sessionItem.id)}
                disabled={revoking === sessionItem.id}
              >
                {revoking === sessionItem.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={sessions.length <= 1}>
                Sign out other sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out from all other devices. Your current session will remain active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeAllOtherSessions} disabled={revokingAll}>
                  {revokingAll ? 'Signing out...' : 'Sign out other sessions'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                Sign out everywhere
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out from all devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out from all devices including this one. You'll need to sign in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOutEverywhere}>
                  Sign out everywhere
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}