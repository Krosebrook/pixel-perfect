/**
 * @fileoverview Authentication form with Zod validation and proper error handling.
 * Supports both sign-in and sign-up flows with input validation.
 */

import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', displayName: '' });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrors({});
    setGeneralError(null);

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

    setIsLoading(true);
    const { error } = await signIn(signInData.email.trim(), signInData.password);
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        setGeneralError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setGeneralError('Please verify your email address before signing in.');
      } else {
        setGeneralError(error.message);
      }
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
                  <Input
                    id="signin-password"
                    type="password"
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signInWithGoogle()}
                  disabled={isLoading}
                >
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
                  Continue with Google
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
                  <Input
                    id="signup-password"
                    type="password"
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
                <Button type="submit" className="w-full" disabled={isLoading}>
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
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signInWithGoogle()}
                  disabled={isLoading}
                >
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
                  Continue with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
