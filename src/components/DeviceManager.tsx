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
import { Smartphone, Monitor, Tablet, Trash2, Shield, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Device {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

function getDeviceIcon(deviceName: string | null) {
  const name = deviceName?.toLowerCase() || '';
  if (name.includes('mobile') || name.includes('phone')) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

function getCurrentDeviceFingerprint(): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  return btoa(`${ua}-${screen}-${timezone}-${language}`).substring(0, 64);
}

export function DeviceManager() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [currentFingerprint, setCurrentFingerprint] = useState<string>('');

  useEffect(() => {
    setCurrentFingerprint(getCurrentDeviceFingerprint());
  }, []);

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      setDevices(devices.filter(d => d.id !== deviceId));
      toast.success('Device removed successfully');
    } catch (error) {
      console.error('Error revoking device:', error);
      toast.error('Failed to remove device');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', user.id)
        .neq('device_fingerprint', currentFingerprint);

      if (error) throw error;

      setDevices(devices.filter(d => d.device_fingerprint === currentFingerprint));
      toast.success('All other devices removed');
    } catch (error) {
      console.error('Error revoking devices:', error);
      toast.error('Failed to remove devices');
    }
  };

  const toggleTrusted = async (deviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ is_trusted: !currentStatus })
        .eq('id', deviceId);

      if (error) throw error;

      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, is_trusted: !currentStatus } : d
      ));
      toast.success(currentStatus ? 'Device unmarked as trusted' : 'Device marked as trusted');
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Manage Devices
          </CardTitle>
          <CardDescription>View and manage devices that have accessed your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
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
              Manage Devices
            </CardTitle>
            <CardDescription>
              View and manage devices that have accessed your account
            </CardDescription>
          </div>
          {devices.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Remove All Other
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all other devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all devices except your current one. You'll need to sign in again on those devices.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeAllOther}>
                    Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No devices found. Device tracking will begin on your next sign-in.
          </p>
        ) : (
          devices.map((device) => {
            const isCurrentDevice = device.device_fingerprint === currentFingerprint;
            
            return (
              <div
                key={device.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getDeviceIcon(device.device_name)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {device.browser || 'Unknown Browser'} on {device.os || 'Unknown OS'}
                      </span>
                      {isCurrentDevice && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {device.is_trusted && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Trusted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {device.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                      </span>
                    </div>
                    {device.ip_address && (
                      <p className="text-xs text-muted-foreground">
                        IP: {device.ip_address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTrusted(device.id, device.is_trusted || false)}
                  >
                    {device.is_trusted ? 'Untrust' : 'Trust'}
                  </Button>
                  {!isCurrentDevice && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={revokingId === device.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove this device?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This device will be removed from your trusted devices. You'll receive an alert if it signs in again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeDevice(device.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
