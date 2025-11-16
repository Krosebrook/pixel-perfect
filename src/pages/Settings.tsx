import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Bell, Shield } from 'lucide-react';
import { RateLimitMonitor } from '@/components/RateLimitMonitor';
import { useProfile } from '@/hooks/useProfile';
import { useBudget, useUpdateBudget } from '@/hooks/useBudget';
import { DEFAULT_ALERT_THRESHOLD } from '@/lib/constants';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: budget, isLoading } = useBudget(user?.id, profile?.environment_mode);
  const updateBudgetMutation = useUpdateBudget();

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    if (budget) {
      setMonthlyBudget(budget.monthly_budget?.toString() || '');
      setDailyLimit(budget.daily_limit?.toString() || '');
      setAlertThreshold(((budget.alert_threshold || DEFAULT_ALERT_THRESHOLD) * 100).toString());
      setEmailNotifications(budget.email_notifications_enabled ?? true);
      setNotificationEmail(budget.notification_email || user?.email || '');
    } else if (user?.email) {
      setNotificationEmail(user.email);
    }
  }, [budget, user?.email]);

  const handleSave = () => {
    if (!user || !profile?.environment_mode) return;

    updateBudgetMutation.mutate({
      user_id: user.id,
      environment_mode: profile.environment_mode,
      monthly_budget: monthlyBudget ? parseFloat(monthlyBudget) : null,
      daily_limit: dailyLimit ? parseFloat(dailyLimit) : null,
      alert_threshold: alertThreshold ? parseFloat(alertThreshold) / 100 : DEFAULT_ALERT_THRESHOLD,
      email_notifications_enabled: emailNotifications,
      notification_email: notificationEmail || null,
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Rate Limit Monitor */}
          <RateLimitMonitor />

          {/* Environment Mode Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Environment Mode
              </CardTitle>
              <CardDescription>
                Your current operating environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Active Environment</p>
                  <Badge variant={profile.environment_mode === 'production' ? 'default' : 'secondary'}>
                    {profile.environment_mode === 'production' ? 'Production' : 'Sandbox'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  {profile.environment_mode === 'sandbox' ? (
                    <p>Lower rate limits for testing</p>
                  ) : (
                    <p>Full rate limits and features</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Configuration
              </CardTitle>
              <CardDescription>
                Set spending limits and alerts for your API usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Monthly Budget ($)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum amount you want to spend per month
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Limit ($)</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum amount you want to spend per day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="80"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get notified when you reach this percentage of your budget
                </p>
              </div>

              {budget && (
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Spending</span>
                    <span className="font-medium">{formatCurrency(budget.current_spending || 0)}</span>
                  </div>
                  {budget.monthly_budget && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget Used</span>
                      <span className="font-medium">
                        {formatPercentage((budget.current_spending || 0) / budget.monthly_budget * 100)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure when and where to receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts for budget thresholds and rate limits
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {emailNotifications && (
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address where notifications will be sent
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={updateBudgetMutation.isPending}
            className="w-full"
          >
            {updateBudgetMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
