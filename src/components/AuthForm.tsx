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
import { AlertCircle, CheckCircle, Mail, AlertTriangle, Clock, Lock } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/constants';
import { ReCaptcha, resetReCaptcha } from '@/components/ReCaptcha';
import { SocialLoginSection } from '@/components/SocialLoginSection';
import { RememberMeCheckbox } from '@/components/RememberMeCheckbox';
import { SignUpSuccessDialog } from '@/components/SignUpSuccessDialog';

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
  const { signIn, signUp, resetPassword, resendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [showSignUpSuccess, setShowSignUpSuccess] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  
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
    } else {
      // Show success dialog with email verification instructions
      setSignUpEmail(signUpData.email.trim());
      setShowSignUpSuccess(true);
      // Clear form data
      setSignUpData({ email: '', password: '', displayName: '' });
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
                
                <div className="flex items-center justify-between gap-4">
                  <RememberMeCheckbox
                    checked={rememberDevice}
                    onCheckedChange={setRememberDevice}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="shrink-0 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                
                <SocialLoginSection disabled={isLoading} />
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
                
                <SocialLoginSection disabled={isLoading} />
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

      {/* Sign Up Success Dialog */}
      <SignUpSuccessDialog
        open={showSignUpSuccess}
        email={signUpEmail}
        onClose={() => setShowSignUpSuccess(false)}
      />
    </div>
  );
}
