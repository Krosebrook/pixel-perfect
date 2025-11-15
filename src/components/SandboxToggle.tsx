import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

export function SandboxToggle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<'sandbox' | 'production' | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('environment_mode')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: rateLimits } = useQuery({
    queryKey: ['rate-limits', profile?.environment_mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limit_config', {
        _environment_mode: profile?.environment_mode || 'production'
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.environment_mode
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', user?.id, profile?.environment_mode],
    queryFn: async () => {
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from('user_budgets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('environment_mode', profile?.environment_mode || 'production')
        .eq('period_start', periodStart)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!profile?.environment_mode
  });

  const updateEnvironmentMode = useMutation({
    mutationFn: async (mode: 'sandbox' | 'production') => {
      const { error } = await supabase
        .from('profiles')
        .update({ environment_mode: mode })
        .eq('id', user?.id);
      
      if (error) throw error;
      return mode;
    },
    onSuccess: (mode) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['rate-limits'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({
        title: 'Environment changed',
        description: `Switched to ${mode} environment`
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to change environment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleToggle = (checked: boolean) => {
    const newMode = checked ? 'production' : 'sandbox';
    
    if (newMode === 'production') {
      setPendingMode(newMode);
      setShowWarning(true);
    } else {
      updateEnvironmentMode.mutate(newMode);
    }
  };

  const confirmSwitch = () => {
    if (pendingMode) {
      updateEnvironmentMode.mutate(pendingMode);
    }
    setShowWarning(false);
    setPendingMode(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isSandbox = profile?.environment_mode === 'sandbox';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Environment Mode
            {isSandbox ? (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                Sandbox
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                Production
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isSandbox 
              ? 'Safe testing environment with limited rate limits and budget caps'
              : 'Full production access with higher rate limits'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="environment-mode"
              checked={!isSandbox}
              onCheckedChange={handleToggle}
              disabled={updateEnvironmentMode.isPending}
            />
            <Label htmlFor="environment-mode" className="cursor-pointer">
              {isSandbox ? 'Switch to Production' : 'Switch to Sandbox'}
            </Label>
          </div>

          {budget && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-sm">Budget Limits</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Spending</p>
                  <p className="font-mono font-semibold">${budget.current_spending?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Limit</p>
                  <p className="font-mono font-semibold">${budget.monthly_budget?.toFixed(2) || '0.00'}</p>
                </div>
                {isSandbox && budget.daily_limit && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Daily Limit (Sandbox)</p>
                    <p className="font-mono font-semibold">${budget.daily_limit?.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {rateLimits && rateLimits.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-sm">Rate Limits</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Per minute: {rateLimits[0].max_calls_per_minute} calls</p>
                <p>Per hour: {rateLimits[0].max_calls_per_hour} calls</p>
                <p>Per day: {rateLimits[0].max_calls_per_day} calls</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Switch to Production?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're about to switch to production mode. This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Enable higher rate limits</li>
                <li>Remove daily budget caps</li>
                <li>Affect your real usage and costs</li>
              </ul>
              <p className="mt-3 font-semibold">Make sure you're ready to use production resources.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMode(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
