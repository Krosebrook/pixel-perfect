import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Bell, Shield } from 'lucide-react';
import { CookiePreferencesSection } from '@/components/CookiePreferencesSection';
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
  placeholder,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "0.00"}
        aria-describedby={`${id}-description`}
      />
      <p id={`${id}-description`} className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  );
});

export default function Settings() {
  const [monthlyBudget, setMonthlyBudget] = useState('100');
  const [dailyLimit, setDailyLimit] = useState('10');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');

  const handleNotificationEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationEmail(e.target.value);
  }, []);

  return (
    <AppLayout>
      <main 
        className="container mx-auto py-8 px-4 max-w-4xl" 
        role="main" 
        aria-label="Settings"
      >
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Environment Mode Display */}
          <EnvironmentModeCard environmentMode="sandbox" />

          {/* Cookie Preferences */}
          <CookiePreferencesSection />

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
              />
              <BudgetInputField
                id="dailyLimit"
                label="Daily Limit ($)"
                description="Maximum amount per day"
                value={dailyLimit}
                onChange={setDailyLimit}
              />
              <BudgetInputField
                id="alertThreshold"
                label="Alert Threshold (%)"
                description="Get notified when spending reaches this percentage of your budget"
                value={alertThreshold}
                onChange={setAlertThreshold}
              />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card role="region" aria-labelledby="notifications-title">
            <CardHeader>
              <CardTitle id="notifications-title" className="flex items-center gap-2">
                <Bell className="h-5 w-5" aria-hidden="true" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive alerts and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive budget alerts via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              {emailNotifications && (
                <div>
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={notificationEmail}
                    onChange={handleNotificationEmailChange}
                    placeholder="your@email.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
