import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  fingerprint: string;
}

function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }
  
  // Detect device type
  let deviceName = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceName = 'Tablet';
    } else {
      deviceName = 'Mobile';
    }
  }
  
  // Create a simple fingerprint based on available info
  const fingerprint = btoa(`${userAgent}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  
  return {
    deviceName,
    browser,
    os,
    fingerprint,
  };
}

export function useDeviceTracking() {
  const checkAndTrackDevice = useCallback(async (userId: string, email: string) => {
    try {
      const deviceInfo = getDeviceInfo();
      
      // Check if this device is already known
      const { data: existingDevice, error: fetchError } = await supabase
        .from('user_devices')
        .select('id, last_seen_at')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking device:', fetchError);
        return;
      }
      
      if (existingDevice) {
        // Known device - just update last_seen_at
        await supabase
          .from('user_devices')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existingDevice.id);
        
        console.log('Known device updated');
      } else {
        // New device - save it and send notification
        const { error: insertError } = await supabase
          .from('user_devices')
          .insert({
            user_id: userId,
            device_fingerprint: deviceInfo.fingerprint,
            device_name: deviceInfo.deviceName,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
          });
        
        if (insertError) {
          console.error('Error saving device:', insertError);
          return;
        }
        
        // Check if user has any other devices (first login shouldn't trigger alert)
        const { count } = await supabase
          .from('user_devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        if (count && count > 1) {
          // Send notification for new device (not first device)
          try {
            await supabase.functions.invoke('send-new-device-alert', {
              body: {
                userId,
                email,
                deviceInfo: {
                  deviceName: deviceInfo.deviceName,
                  browser: deviceInfo.browser,
                  os: deviceInfo.os,
                },
              },
            });
            console.log('New device alert sent');
          } catch (notifyError) {
            console.error('Error sending device alert:', notifyError);
          }
        }
      }
    } catch (error) {
      console.error('Error in device tracking:', error);
    }
  }, []);
  
  return { checkAndTrackDevice };
}
