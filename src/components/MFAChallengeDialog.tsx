/**
 * @fileoverview MFA Challenge Dialog for users with 2FA enabled.
 * Shown after password authentication when MFA verification is required.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2, Key, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MFAChallengeDialogProps {
  open: boolean;
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAChallengeDialog({ open, factorId, onSuccess, onCancel }: MFAChallengeDialogProps) {
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('totp');

  const handleVerifyTOTP = async () => {
    if (code.length !== 6) return;
    
    setVerifying(true);
    setError(null);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        setError(challengeError.message);
        setVerifying(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) {
        setError('Invalid verification code. Please try again.');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setVerifying(false);
  };

  const handleVerifyRecoveryCode = async () => {
    if (!recoveryCode.trim()) return;
    
    setVerifying(true);
    setError(null);

    try {
      // Use edge function for secure verification
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('hash-recovery-code', {
        body: { action: 'verify', code: recoveryCode }
      });

      if (verifyError || !verifyResult?.valid) {
        setError(verifyResult?.error || 'Invalid or already used recovery code');
        setVerifying(false);
        return;
      }

      // Recovery code was valid, complete the challenge
      onSuccess();
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setVerifying(false);
  };

  const handleClose = () => {
    setCode('');
    setRecoveryCode('');
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the verification code from your authenticator app or use a recovery code.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="recovery" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Recovery Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-digit code</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter the code from your authenticator app
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyTOTP}
                disabled={code.length !== 6 || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-code">Recovery Code</Label>
              <Input
                id="recovery-code"
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Each recovery code can only be used once
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleVerifyRecoveryCode}
                disabled={!recoveryCode.trim() || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Use Recovery Code'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
