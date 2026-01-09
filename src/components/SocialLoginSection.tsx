/**
 * @fileoverview Social login buttons section with improved error handling.
 * Only Google OAuth is currently supported in Lovable Cloud.
 * Provides clear, user-friendly error messages for authentication issues.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SocialLoginSectionProps {
  disabled?: boolean;
  className?: string;
}

/**
 * Maps technical OAuth error messages to user-friendly descriptions
 */
function getOAuthErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error?.message) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Provider not enabled errors
  if (message.includes('unsupported provider') || message.includes('provider is not enabled')) {
    return 'This login method is not available. Please use email/password or Google sign-in.';
  }

  // 403 Forbidden - typically Google OAuth misconfiguration
  if (message.includes('403') || message.includes('access_denied')) {
    return 'Access was denied by the authentication provider. This may be a temporary issue - please try again or use email/password login.';
  }

  // Network/connection errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many login attempts. Please wait a few minutes before trying again.';
  }

  // Email already in use
  if (message.includes('already registered') || message.includes('email already')) {
    return 'An account with this email already exists. Try signing in with email/password instead.';
  }

  // Popup blocked
  if (message.includes('popup') || message.includes('blocked')) {
    return 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
  }

  // User cancelled
  if (message.includes('cancelled') || message.includes('canceled') || message.includes('user closed')) {
    return 'Sign-in was cancelled. Please try again when ready.';
  }

  // Generic OAuth errors
  if (message.includes('oauth') || message.includes('authentication failed')) {
    return 'Authentication failed. Please try again or use email/password login.';
  }

  // Return original message if no pattern matched, but clean it up
  return error.message.length > 150 
    ? `${error.message.substring(0, 150)}...` 
    : error.message;
}

export function SocialLoginSection({ disabled = false, className = '' }: SocialLoginSectionProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerificationReminder, setShowEmailVerificationReminder] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setShowEmailVerificationReminder(false);
    setIsLoading(true);

    try {
      const { error: authError } = await signInWithGoogle();
      
      if (authError) {
        const userMessage = getOAuthErrorMessage(authError);
        
        // Check if this is a new user signup that needs email verification
        if (authError.message?.includes('confirm') || authError.message?.includes('verify')) {
          setShowEmailVerificationReminder(true);
        } else {
          setError(userMessage);
        }
        setIsLoading(false);
      }
      // If no error, the user will be redirected, so we keep loading state
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <section 
      className={`space-y-4 ${className}`}
      aria-label="Social login options"
      role="group"
    >
      {/* Divider */}
      <div className="relative py-2" role="separator">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Email Verification Reminder */}
      {showEmailVerificationReminder && (
        <Alert className="border-primary/20 bg-primary/5" role="status">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          <AlertTitle className="text-sm font-medium">Email Verification</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Your account is linked to your Google email. Please ensure you have access to this email for account recovery and important notifications.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert with helpful suggestions */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <p className="text-xs opacity-80">
              You can also sign in with your email and password above.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Google Sign-In Button - Primary social login option */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 font-medium transition-all hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={handleGoogleLogin}
        disabled={disabled || isLoading}
        aria-label="Sign in with Google"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </Button>

      {/* Privacy Notice */}
      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link 
          to="/terms" 
          className="underline underline-offset-2 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link 
          to="/privacy" 
          className="underline underline-offset-2 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Privacy Policy
        </Link>
      </p>

      {/* Additional Info */}
      <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Google sign-in uses secure OAuth 2.0 authentication. We never receive or store your Google password.
        </p>
      </div>
    </section>
  );
}
