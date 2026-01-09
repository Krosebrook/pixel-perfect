/**
 * @fileoverview Cookie preferences management component.
 * Allows users to update their cookie consent choices after initial consent.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cookie, 
  Shield, 
  BarChart3, 
  Target, 
  Sparkles, 
  CheckCircle,
  Info
} from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CookieCategory {
  key: keyof CookiePreferences;
  title: string;
  description: string;
  icon: React.ReactNode;
  required?: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    key: 'necessary',
    title: 'Strictly Necessary',
    description: 'Essential for the website to function properly. These cookies cannot be disabled.',
    icon: <Shield className="h-4 w-4" />,
    required: true,
  },
  {
    key: 'analytics',
    title: 'Analytics',
    description: 'Help us understand how visitors interact with our website to improve user experience.',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    key: 'marketing',
    title: 'Marketing',
    description: 'Used to track visitors across websites for advertising purposes.',
    icon: <Target className="h-4 w-4" />,
  },
  {
    key: 'personalization',
    title: 'Personalization',
    description: 'Allow us to remember your preferences and customize your experience.',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

export function CookiePreferencesSection() {
  const {
    preferences,
    hasConsented,
    consentedAt,
    updatePreference,
    savePreferences,
    acceptAll,
    rejectAll,
    resetConsent,
  } = useCookieConsent();

  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    savePreferences();
    setShowSaved(true);
    toast.success('Cookie preferences saved');
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setShowSaved(true);
    toast.success('All cookies accepted');
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowSaved(true);
    toast.success('Optional cookies rejected');
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <Card role="region" aria-labelledby="cookie-preferences-title">
      <CardHeader>
        <CardTitle id="cookie-preferences-title" className="flex items-center gap-2">
          <Cookie className="h-5 w-5" aria-hidden="true" />
          Cookie Preferences
        </CardTitle>
        <CardDescription>
          Manage how we use cookies on this website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consent Status */}
        {hasConsented && consentedAt && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" />
            <AlertDescription className="text-sm">
              You last updated your preferences on{' '}
              <strong>{new Date(consentedAt).toLocaleDateString()}</strong>
            </AlertDescription>
          </Alert>
        )}

        {showSaved && (
          <Alert className="border-green-500/20 bg-green-500/5">
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your cookie preferences have been saved.
            </AlertDescription>
          </Alert>
        )}

        {/* Cookie Categories */}
        <div className="space-y-4">
          {COOKIE_CATEGORIES.map((category, index) => (
            <div key={category.key}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-muted p-2 shrink-0 mt-0.5">
                    {category.icon}
                  </div>
                  <div className="space-y-1">
                    <Label 
                      htmlFor={`cookie-pref-${category.key}`}
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      {category.title}
                      {category.required && (
                        <span className="text-xs text-muted-foreground font-normal">(Required)</span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`cookie-pref-${category.key}`}
                  checked={preferences[category.key]}
                  onCheckedChange={(checked) => updatePreference(category.key, checked)}
                  disabled={category.required}
                  aria-describedby={`cookie-pref-${category.key}-desc`}
                />
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            Save Preferences
          </Button>
          <Button variant="outline" onClick={handleAcceptAll} className="flex-1 sm:flex-none">
            Accept All
          </Button>
          <Button variant="outline" onClick={handleRejectAll} className="flex-1 sm:flex-none">
            Reject Optional
          </Button>
        </div>

        {/* Privacy Policy Link */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            For more information about how we use cookies and your data, please read our{' '}
            <Link 
              to="/privacy" 
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This complies with GDPR and ePrivacy Directive requirements
        </p>
      </CardContent>
    </Card>
  );
}
