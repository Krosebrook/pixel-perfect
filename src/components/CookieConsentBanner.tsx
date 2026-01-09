/**
 * @fileoverview Cookie consent banner with preference management.
 * Compliant with GDPR/CCPA requirements.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Cookie, Settings, Shield, BarChart3, Target, Sparkles } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';
import { cn } from '@/lib/utils';

interface CookieConsentBannerProps {
  className?: string;
}

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
    description: 'Essential for the website to function. Cannot be disabled.',
    icon: <Shield className="h-4 w-4" />,
    required: true,
  },
  {
    key: 'analytics',
    title: 'Analytics',
    description: 'Help us understand how visitors interact with our website.',
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

export function CookieConsentBanner({ className }: CookieConsentBannerProps) {
  const {
    preferences,
    hasConsented,
    isLoaded,
    acceptAll,
    rejectAll,
    updatePreference,
    savePreferences,
  } = useCookieConsent();
  
  const [showPreferences, setShowPreferences] = useState(false);

  // Don't render until we've loaded saved preferences
  if (!isLoaded || hasConsented) {
    return null;
  }

  const handleSavePreferences = () => {
    savePreferences();
    setShowPreferences(false);
  };

  return (
    <>
      {/* Main Banner */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6',
          'bg-gradient-to-t from-background via-background to-background/95',
          'border-t border-border/50 shadow-lg',
          'animate-in slide-in-from-bottom-5 duration-300',
          className
        )}
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <Cookie className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 id="cookie-banner-title" className="text-sm font-semibold">
                  We value your privacy
                </h2>
                <p id="cookie-banner-description" className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                  By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                  <Link 
                    to="/privacy" 
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>{' '}
                  to learn more.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="gap-1.5 text-xs"
              >
                <Settings className="h-3.5 w-3.5" />
                Manage Preferences
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="text-xs"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="text-xs"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences below. You can enable or disable different types of cookies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {COOKIE_CATEGORIES.map((category, index) => (
              <div key={category.key}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-1.5 shrink-0 mt-0.5">
                      {category.icon}
                    </div>
                    <div className="space-y-1">
                      <Label 
                        htmlFor={`cookie-${category.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {category.title}
                        {category.required && (
                          <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={`cookie-${category.key}`}
                    checked={preferences[category.key]}
                    onCheckedChange={(checked) => updatePreference(category.key, checked)}
                    disabled={category.required}
                    aria-describedby={`cookie-${category.key}-desc`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              For more information about how we use cookies and your data, please read our{' '}
              <Link 
                to="/privacy" 
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setShowPreferences(false)}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
