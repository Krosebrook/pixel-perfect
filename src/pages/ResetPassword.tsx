/**
 * @fileoverview Password reset page for users who clicked the reset link in their email.
 * Handles password update with validation.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const resetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function ResetPassword() {
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    // If no session (no valid reset token), redirect to auth
    if (!session) {
      const timer = setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const result = resetSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as 'password' | 'confirmPassword';
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(formData.password);
    
    if (!error) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } else {
      setGeneralError(error.message);
    }
    setIsLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle className="text-2xl font-bold">Password Updated!</CardTitle>
            </div>
            <CardDescription>
              Your password has been successfully updated. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              />
              {errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and a number.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
