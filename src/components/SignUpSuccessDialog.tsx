/**
 * @fileoverview Success dialog shown after successful email/password signup.
 * Provides clear email verification instructions.
 */

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SignUpSuccessDialogProps {
  open: boolean;
  email: string;
  onClose: () => void;
}

export function SignUpSuccessDialog({ open, email, onClose }: SignUpSuccessDialogProps) {
  const { resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    const { error } = await resendVerificationEmail(email);
    
    if (!error) {
      setResendSuccess(true);
    }
    
    setIsResending(false);
  };

  const handleClose = () => {
    setResendSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl">Account Created Successfully!</DialogTitle>
          <DialogDescription className="text-base">
            Welcome! We've sent a verification email to confirm your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Info */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Next steps:</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  1
                </span>
                Open the email from us in your inbox
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  2
                </span>
                Click the verification link in the email
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  3
                </span>
                Return here and sign in to your account
              </li>
            </ol>
          </div>

          {/* Resend Success */}
          {resendSuccess && (
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Verification email resent successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Didn't receive email */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Didn't receive the email? Check your spam folder or click below to resend.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="w-full text-xs"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-1.5 h-3 w-3" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full gap-2">
            Continue to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
