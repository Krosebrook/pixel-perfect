import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer } from 'lucide-react';
import { SESSION_TIMEOUT_OPTIONS, SESSION_TIMEOUT_MS, STORAGE_KEYS } from '@/lib/constants';

export function SessionTimeoutSettings() {
  const [selectedTimeout, setSelectedTimeout] = useState<number>(SESSION_TIMEOUT_MS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_TIMEOUT);
    if (stored) {
      setSelectedTimeout(parseInt(stored, 10));
    }
  }, []);

  const handleTimeoutChange = (value: string) => {
    const timeout = parseInt(value, 10);
    setSelectedTimeout(timeout);
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMEOUT, value);
    // Dispatch event so useSessionTimeout can pick up the change
    window.dispatchEvent(new CustomEvent('session-timeout-changed', { detail: timeout }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Session Timeout
        </CardTitle>
        <CardDescription>
          Set how long before you're automatically logged out due to inactivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Inactivity Timeout</Label>
            <Select value={selectedTimeout.toString()} onValueChange={handleTimeoutChange}>
              <SelectTrigger id="session-timeout" className="w-full">
                <SelectValue placeholder="Select timeout duration" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TIMEOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You'll receive a warning 1 minute before being logged out
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
