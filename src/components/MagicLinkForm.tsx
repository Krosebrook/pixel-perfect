/**
 * @fileoverview Magic link (passwordless) authentication form.
 * Allows users to sign in via email link without a password.
 */

import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';

const emailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

interface MagicLinkFormProps {
  onBack: () => void;
  className?: string;
}

export function MagicLinkForm({ onBack, className = '' }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('rate limit')) {
          setError('Too many requests. Please wait a few minutes before trying again.');
        } else if (authError.message.includes('not found') || authError.message.includes('not registered')) {
          // Still send the magic link - Supabase will create the account
          setSuccess(true);
        } else {
          setError(authError.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              We've sent a magic link to <strong className="text-foreground">{email}</strong>. 
              Click the link to sign in.
            </p>
          </div>
          <div className="space-y-2 pt-4 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Try a different email
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Didn't receive the email? Check your spam folder or try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center space-y-2 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Sign in with Magic Link</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a sign-in link. No password needed!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="magic-link-email">Email address</Label>
          <Input
            id="magic-link-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending magic link...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Magic Link
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to password sign in
        </Button>
      </form>

      <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-3">
        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Magic links expire after 1 hour. If you don't see the email, check your spam folder.
        </p>
      </div>
    </div>
  );
}
