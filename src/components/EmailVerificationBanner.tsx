/**
 * @fileoverview Email verification banner component.
 * Shows a reminder for users who haven't verified their email address.
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
  className?: string;
}

export function EmailVerificationBanner({ 
  email, 
  onDismiss,
  className = '' 
}: EmailVerificationBannerProps) {
  const { resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    const { error } = await resendVerificationEmail(email);
    
    if (!error) {
      setResendSuccess(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    }
    
    setIsResending(false);
  };

  if (resendSuccess) {
    return (
      <Alert className={`border-green-500/20 bg-green-500/5 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
        <AlertTitle className="text-sm font-medium text-green-700 dark:text-green-400">
          Verification email sent!
        </AlertTitle>
        <AlertDescription className="text-xs text-green-600 dark:text-green-500">
          Please check your inbox at <strong>{email}</strong> and click the verification link.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-warning/20 bg-warning/5 ${className}`}>
      <Mail className="h-4 w-4 text-warning" aria-hidden="true" />
      <div className="flex-1">
        <AlertTitle className="text-sm font-medium">
          Verify your email address
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1">
          We've sent a verification email to <strong>{email}</strong>. 
          Please check your inbox and click the link to verify your account.
        </AlertDescription>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending}
            className="h-7 text-xs"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-1.5 h-3 w-3" />
                Resend email
              </>
            )}
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 text-xs text-muted-foreground"
            >
              Dismiss
            </Button>
          )}
        </div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="absolute right-2 top-2 h-6 w-6 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Alert>
  );
}
