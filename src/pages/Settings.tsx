import { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { AccountActivityLog } from '@/components/AccountActivityLog';
import { SessionManager } from '@/components/SessionManager';
import { DeviceManager } from '@/components/DeviceManager';
import { SessionTimeoutSettings } from '@/components/SessionTimeoutSettings';
import { useProfile } from '@/hooks/useProfile';
import { useBudget, useUpdateBudget } from '@/hooks/useBudget';
import { DEFAULT_ALERT_THRESHOLD } from '@/lib/constants';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

// Memoized environment mode card
const EnvironmentModeCard = memo(function EnvironmentModeCard({
  environmentMode,
}: {
  environmentMode: string | null;
}) {
  const isProduction = environmentMode === 'production';
  
  return (
    <Card role="region" aria-labelledby="environment-mode-title">
      <CardHeader>
        <CardTitle id="environment-mode-title" className="flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
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
            <Badge 
              variant={isProduction ? 'default' : 'secondary'}
              aria-label={`Current mode: ${isProduction ? 'Production' : 'Sandbox'}`}
            >
              {isProduction ? 'Production' : 'Sandbox'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            {isProduction ? (
              <p>Full rate limits and features</p>
            ) : (
              <p>Lower rate limits for testing</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized budget input field
const BudgetInputField = memo(function BudgetInputField({
  id,
  label,
  description,
  value,
  onChange,
  type = 'number',
  step,
  min,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-describedby={`${id}-description`}
      />
      <p id={`${id}-description`} className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
});

// Memoized current spending display
const CurrentSpendingDisplay = memo(function CurrentSpendingDisplay({
  currentSpending,
  monthlyBudget,
}: {
  currentSpending: number;
  monthlyBudget: number | null;
}) {
  const budgetUsedPercentage = useMemo(() => {
    if (!monthlyBudget) return null;
    return (currentSpending / monthlyBudget) * 100;
  }, [currentSpending, monthlyBudget]);

  return (
    <div className="pt-4 border-t space-y-2" role="region" aria-label="Current spending">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Current Spending</span>
        <span className="font-medium">{formatCurrency(currentSpending)}</span>
      </div>
      {budgetUsedPercentage !== null && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget Used</span>
          <span className="font-medium">
            {formatPercentage(budgetUsedPercentage)}
          </span>
        </div>
      )}
    </div>
  );
});

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

  const handleSave = useCallback(() => {
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
  }, [user, profile?.environment_mode, monthlyBudget, dailyLimit, alertThreshold, emailNotifications, notificationEmail, updateBudgetMutation]);

  const handleNotificationEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationEmail(e.target.value);
  }, []);

  const loadingContent = useMemo(() => (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4" role="main">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          Loading...
        </p>
      </main>
    </div>
  ), []);

  if (isLoading || !profile) {
    return loadingContent;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main 
        className="container mx-auto py-8 px-4 max-w-4xl" 
        role="main" 
        aria-label="Settings"
      >
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Rate Limit Monitor */}
          <RateLimitMonitor />

          {/* Environment Mode Display */}
          <EnvironmentModeCard environmentMode={profile.environment_mode} />

          {/* Two-Factor Authentication */}
          <TwoFactorSetup />

          {/* Session Timeout Settings */}
          <SessionTimeoutSettings />

          {/* Session Manager */}
          <SessionManager />

          {/* Device Manager */}
          <DeviceManager />

          {/* Account Activity Log */}
          <AccountActivityLog />

          {/* Budget Configuration */}
          <Card role="region" aria-labelledby="budget-config-title">
            <CardHeader>
              <CardTitle id="budget-config-title" className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" aria-hidden="true" />
                Budget Configuration
              </CardTitle>
              <CardDescription>
                Set spending limits and alerts for your API usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BudgetInputField
                id="monthlyBudget"
                label="Monthly Budget ($)"
                description="Maximum amount you want to spend per month"
                value={monthlyBudget}
                onChange={setMonthlyBudget}
                step="0.01"
                placeholder="100.00"
              />

              <BudgetInputField
                id="dailyLimit"
                label="Daily Limit ($)"
                description="Maximum amount you want to spend per day"
                value={dailyLimit}
                onChange={setDailyLimit}
                step="0.01"
                placeholder="10.00"
              />

              <BudgetInputField
                id="alertThreshold"
                label="Alert Threshold (%)"
                description="Get notified when you reach this percentage of your budget"
                value={alertThreshold}
                onChange={setAlertThreshold}
                min="0"
                max="100"
                placeholder="80"
              />

              {budget && (
                <CurrentSpendingDisplay
                  currentSpending={budget.current_spending || 0}
                  monthlyBudget={budget.monthly_budget}
                />
              )}
            </CardContent>
          </Card>

          {/* Email Notification Preferences */}
          <Card role="region" aria-labelledby="email-notifications-title">
            <CardHeader>
              <CardTitle id="email-notifications-title" className="flex items-center gap-2">
                <Bell className="h-5 w-5" aria-hidden="true" />
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
                  <p id="emailNotifications-description" className="text-xs text-muted-foreground">
                    Receive alerts for budget thresholds and rate limits
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  aria-describedby="emailNotifications-description"
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
                    onChange={handleNotificationEmailChange}
                    aria-describedby="notificationEmail-description"
                  />
                  <p id="notificationEmail-description" className="text-xs text-muted-foreground">
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
            aria-busy={updateBudgetMutation.isPending}
          >
            {updateBudgetMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </main>
    </div>
  );
}
