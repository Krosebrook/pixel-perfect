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
  const { signIn, signUp } = useAuth();
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
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
