/**
 * @fileoverview Authentication form with Zod validation and proper error handling.
 * Supports both sign-in and sign-up flows with input validation.
 * Includes rate limiting and account lockout protection.
 */

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle, Github, Mail, AlertTriangle, Clock, Lock } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';
import { ReCaptcha, resetReCaptcha } from '@/components/ReCaptcha';

interface RateLimitStatus {
  isLocked: boolean;
  failedAttempts: number;
  lockoutRemainingSeconds: number;
  remainingAttempts?: number;
  maxAttempts: number;
}
// Validation schemas
const emailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const displayNameSchema = z.string()
  .trim()
  .max(100, 'Display name must be less than 100 characters')
  .optional();

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

interface ValidationErrors {
  email?: string;
  password?: string;
  displayName?: string;
}

export function AuthForm() {
  const { signIn, signUp, signInWithGoogle, signInWithGitHub, signInWithAzure, signInWithApple, resetPassword, resendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | 'azure' | 'apple' | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', displayName: '' });
  const [rememberDevice, setRememberDevice] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutCountdown(prev => {
        if (prev <= 1) {
          setRateLimitStatus(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const checkRateLimit = async (email: string): Promise<RateLimitStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-rate-limit', {
        body: { email, action: 'check' }
      });
      
      if (error) {
        console.error('Rate limit check error:', error);
        return null;
      }
      
      return data as RateLimitStatus;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return null;
    }
  };

  const recordLoginAttempt = async (email: string, success: boolean) => {
    try {
      const { data } = await supabase.functions.invoke('check-login-rate-limit', {
        body: { email, action: success ? 'record_success' : 'record_failure' }
      });
      
      if (!success && data) {
        const status = data as RateLimitStatus;
        setRateLimitStatus(status);
        if (status.isLocked && status.lockoutRemainingSeconds > 0) {
          setLockoutCountdown(status.lockoutRemainingSeconds);
        }
      }
      
      return data as RateLimitStatus | null;
    } catch (err) {
      console.error('Record login attempt failed:', err);
      return null;
    }
  };

  const formatLockoutTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecaptchaVerify = useCallback((token: string) => {
    setRecaptchaToken(token);
  }, []);

  const handleRecaptchaExpire = useCallback(() => {
    setRecaptchaToken(null);
  }, []);
  const handleResendVerification = async () => {
    if (!emailNotVerified) return;
    setResendingVerification(true);
    await resendVerificationEmail(emailNotVerified);
    setResendingVerification(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError(null);

    const emailResult = emailSchema.safeParse(forgotPasswordEmail);
    if (!emailResult.success) {
      setForgotPasswordError(emailResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(forgotPasswordEmail.trim());
    
    if (!error) {
      setForgotPasswordSuccess(true);
    } else {
      setForgotPasswordError(error.message);
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    setGeneralError(null);
    setEmailNotVerified(null);

    // Validate input
    const result = signInSchema.safeParse(signInData);
    if (!result.success) {
      const errors: ValidationErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setSignInErrors(errors);
      return;
    }

    // Check reCAPTCHA (only if configured)
    const recaptchaRequired = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaRequired && !recaptchaToken) {
      setGeneralError('Please complete the reCAPTCHA verification.');
      return;
    }

    setIsLoading(true);
    
    // Check rate limit before attempting login
    const limitStatus = await checkRateLimit(signInData.email.trim());
    if (limitStatus?.isLocked) {
      setRateLimitStatus(limitStatus);
      setLockoutCountdown(limitStatus.lockoutRemainingSeconds);
      setIsLoading(false);
      return;
    }
    
    // Store remember device preference before sign in
    localStorage.setItem(STORAGE_KEYS.REMEMBER_DEVICE, rememberDevice.toString());
    
    const { error } = await signIn(signInData.email.trim(), signInData.password);
    
    if (error) {
      // Record failed attempt
      await recordLoginAttempt(signInData.email.trim(), false);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        const remaining = rateLimitStatus?.remainingAttempts ?? (5 - (limitStatus?.failedAttempts ?? 0) - 1);
        if (remaining > 0) {
          setGeneralError(`Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout.`);
        } else {
          setGeneralError('Invalid email or password. Your account is now temporarily locked.');
        }
      } else if (error.message.includes('Email not confirmed')) {
        setEmailNotVerified(signInData.email.trim());
      } else {
        setGeneralError(error.message);
      }
    } else {
      // Record successful login
      await recordLoginAttempt(signInData.email.trim(), true);
      setRateLimitStatus(null);
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrors({});
    setGeneralError(null);

    // Validate input
    const result = signUpSchema.safeParse(signUpData);
    if (!result.success) {
      const errors: ValidationErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setSignUpErrors(errors);
      return;
    }

    // Check reCAPTCHA (only if configured)
    const recaptchaRequired = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaRequired && !recaptchaToken) {
      setGeneralError('Please complete the reCAPTCHA verification.');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      signUpData.email.trim(), 
      signUpData.password, 
      signUpData.displayName?.trim() || undefined
    );
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        setGeneralError('An account with this email already exists. Please sign in instead.');
      } else if (error.message.includes('Password')) {
        setSignUpErrors({ password: error.message });
      } else {
        setGeneralError(error.message);
      }
    }
    setIsLoading(false);
  };

  const clearErrors = () => {
    setSignInErrors({});
    setSignUpErrors({});
    setGeneralError(null);
    setEmailNotVerified(null);
    setRecaptchaToken(null);
    resetReCaptcha();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to UPGE</CardTitle>
          <CardDescription>Universal Prompt Generator Engine</CardDescription>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {emailNotVerified && (
            <Alert className="mb-4 border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex flex-col gap-2">
                <span>Please verify your email address before signing in.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="w-fit"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {resendingVerification ? 'Sending...' : 'Resend verification email'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {rateLimitStatus?.isLocked && lockoutCountdown > 0 && (
            <Alert variant="destructive" className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <span className="font-medium">Account temporarily locked</span>
                <span>
                  Too many failed login attempts. Please try again in{' '}
                  <span className="font-mono font-bold">{formatLockoutTime(lockoutCountdown)}</span>
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>This helps protect your account from unauthorized access</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Show remaining attempts warning (not locked yet) */}
          {rateLimitStatus && !rateLimitStatus.isLocked && rateLimitStatus.failedAttempts > 0 && (
            <Alert className="mb-4 border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-warning">Login attempts remaining</span>
                  <span className="font-mono font-bold text-warning">
                    {rateLimitStatus.maxAttempts - rateLimitStatus.failedAttempts} of {rateLimitStatus.maxAttempts}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-warning transition-all duration-300"
                    style={{ 
                      width: `${((rateLimitStatus.maxAttempts - rateLimitStatus.failedAttempts) / rateLimitStatus.maxAttempts) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account will be temporarily locked after {rateLimitStatus.maxAttempts - rateLimitStatus.failedAttempts} more failed attempt{rateLimitStatus.maxAttempts - rateLimitStatus.failedAttempts !== 1 ? 's' : ''}.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="signin" className="w-full" onValueChange={clearErrors}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    aria-invalid={!!signInErrors.email}
                    aria-describedby={signInErrors.email ? 'signin-email-error' : undefined}
                  />
                  {signInErrors.email && (
                    <p id="signin-email-error" className="text-sm text-destructive">
                      {signInErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <PasswordInput
                    id="signin-password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    aria-invalid={!!signInErrors.password}
                    aria-describedby={signInErrors.password ? 'signin-password-error' : undefined}
                  />
                  {signInErrors.password && (
                    <p id="signin-password-error" className="text-sm text-destructive">
                      {signInErrors.password}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-device"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked === true)}
                    />
                    <div className="grid gap-0.5">
                      <Label htmlFor="remember-device" className="text-sm cursor-pointer">
                        Remember this device
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Extends session to 7 days
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                <ReCaptcha
                  onVerify={handleRecaptchaVerify}
                  onExpire={handleRecaptchaExpire}
                />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || (!!import.meta.env.VITE_RECAPTCHA_SITE_KEY && !recaptchaToken) || (rateLimitStatus?.isLocked && lockoutCountdown > 0)}
              >
                  {isLoading ? 'Signing in...' : rateLimitStatus?.isLocked && lockoutCountdown > 0 ? `Locked (${formatLockoutTime(lockoutCountdown)})` : 'Sign In'}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                {oauthError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{oauthError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('google');
                    const { error } = await signInWithGoogle();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Google');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'google' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                  {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('github');
                    const { error } = await signInWithGitHub();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with GitHub');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'github' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  {oauthLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('azure');
                    const { error } = await signInWithAzure();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Microsoft');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'azure' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                  )}
                  {oauthLoading === 'azure' ? 'Connecting...' : 'Continue with Microsoft'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('apple');
                    const { error } = await signInWithApple();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Apple');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'apple' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  {oauthLoading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your Name"
                    value={signUpData.displayName}
                    onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}
                    aria-invalid={!!signUpErrors.displayName}
                    aria-describedby={signUpErrors.displayName ? 'signup-name-error' : undefined}
                  />
                  {signUpErrors.displayName && (
                    <p id="signup-name-error" className="text-sm text-destructive">
                      {signUpErrors.displayName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    aria-invalid={!!signUpErrors.email}
                    aria-describedby={signUpErrors.email ? 'signup-email-error' : undefined}
                  />
                  {signUpErrors.email && (
                    <p id="signup-email-error" className="text-sm text-destructive">
                      {signUpErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    aria-invalid={!!signUpErrors.password}
                    aria-describedby={signUpErrors.password ? 'signup-password-error' : undefined}
                  />
                  {signUpErrors.password && (
                    <p id="signup-password-error" className="text-sm text-destructive">
                      {signUpErrors.password}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and a number.
                  </p>
                </div>

                <ReCaptcha
                  onVerify={handleRecaptchaVerify}
                  onExpire={handleRecaptchaExpire}
                />

                <Button type="submit" className="w-full" disabled={isLoading || (!!import.meta.env.VITE_RECAPTCHA_SITE_KEY && !recaptchaToken)}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                {oauthError && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{oauthError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('google');
                    const { error } = await signInWithGoogle();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Google');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'google' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                  {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('github');
                    const { error } = await signInWithGitHub();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with GitHub');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'github' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  {oauthLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('azure');
                    const { error } = await signInWithAzure();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Microsoft');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'azure' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                      <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                  )}
                  {oauthLoading === 'azure' ? 'Connecting...' : 'Continue with Microsoft'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setOauthError(null);
                    setOauthLoading('apple');
                    const { error } = await signInWithApple();
                    if (error) {
                      setOauthError(error.message || 'Failed to sign in with Apple');
                      setOauthLoading(null);
                    }
                  }}
                  disabled={isLoading || oauthLoading !== null}
                >
                  {oauthLoading === 'apple' ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  {oauthLoading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setForgotPasswordEmail('');
          setForgotPasswordError(null);
          setForgotPasswordSuccess(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          {forgotPasswordSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Check your email for a password reset link. If you don't see it, check your spam folder.
              </p>
              <Button onClick={() => setShowForgotPassword(false)} className="w-full">
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotPasswordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{forgotPasswordError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
