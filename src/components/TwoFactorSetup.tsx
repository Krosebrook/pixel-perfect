/**
 * @fileoverview Two-Factor Authentication setup component using TOTP.
 * Allows users to enroll, verify, and manage 2FA for their account.
 * Includes backup recovery codes for account recovery.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle, Key, RefreshCw, Download } from 'lucide-react';
import { Factor } from '@supabase/supabase-js';

export function TwoFactorSetup() {
  const { user, enrollTOTP, verifyTOTP, unenrollTOTP, getMFAFactors, generateRecoveryCodes, getRecoveryCodesCount } = useAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRecoveryCodesDialog, setShowRecoveryCodesDialog] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{ qr: string; secret: string; factorId: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState(0);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const hasVerifiedFactor = factors.some(f => f.status === 'verified');

  useEffect(() => {
    loadFactors();
  }, []);

  useEffect(() => {
    if (hasVerifiedFactor) {
      loadRecoveryCodesCount();
    }
  }, [hasVerifiedFactor]);

  const loadFactors = async () => {
    setLoading(true);
    const { factors: loadedFactors } = await getMFAFactors();
    setFactors(loadedFactors);
    setLoading(false);
  };

  const loadRecoveryCodesCount = async () => {
    const { count } = await getRecoveryCodesCount();
    setRecoveryCodesCount(count);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await enrollTOTP();
    
    if (!error && data && data.type === 'totp') {
      setEnrollmentData({
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      });
      setShowEnrollDialog(true);
    }
    setEnrolling(false);
  };

  const handleVerify = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;
    
    setVerifying(true);
    const { error } = await verifyTOTP(enrollmentData.factorId, verificationCode);
    
    if (!error) {
      // Generate recovery codes after successful enrollment
      setGeneratingCodes(true);
      const { codes } = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      setGeneratingCodes(false);
      
      setShowEnrollDialog(false);
      setEnrollmentData(null);
      setVerificationCode('');
      
      // Show recovery codes dialog
      if (codes.length > 0) {
        setShowRecoveryCodesDialog(true);
      }
      
      await loadFactors();
      await loadRecoveryCodesCount();
    }
    setVerifying(false);
  };

  const handleDisable = async () => {
    const verifiedFactor = factors.find(f => f.status === 'verified');
    if (!verifiedFactor) return;

    setVerifying(true);
    const { error } = await unenrollTOTP(verifiedFactor.id);
    
    if (!error) {
      setShowDisableDialog(false);
      await loadFactors();
    }
    setVerifying(false);
  };

  const handleRegenerateRecoveryCodes = async () => {
    setGeneratingCodes(true);
    const { codes } = await generateRecoveryCodes();
    setRecoveryCodes(codes);
    setGeneratingCodes(false);
    if (codes.length > 0) {
      setShowRecoveryCodesDialog(true);
    }
    await loadRecoveryCodesCount();
  };

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadRecoveryCodes = () => {
    const codesText = `UPGE Recovery Codes\n${'='.repeat(30)}\n\nKeep these codes safe. Each code can only be used once.\n\n${recoveryCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'upge-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasVerifiedFactor ? (
            <div className="space-y-4">
              <Alert className="border-success bg-success/10">
                <ShieldCheck className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Two-factor authentication is enabled on your account.
                </AlertDescription>
              </Alert>

              {/* Recovery Codes Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Recovery Codes</p>
                    <p className="text-sm text-muted-foreground">
                      {recoveryCodesCount} codes remaining
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRegenerateRecoveryCodes}
                  disabled={generatingCodes}
                >
                  {generatingCodes ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="destructive" 
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Protect your account by requiring a verification code from your authenticator app when signing in.
                </AlertDescription>
              </Alert>
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEnrollDialog(false);
          setEnrollmentData(null);
          setVerificationCode('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (like Google Authenticator, Authy, or 1Password).
            </DialogDescription>
          </DialogHeader>
          
          {enrollmentData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={enrollmentData.qr} 
                  alt="QR Code for 2FA" 
                  className="w-48 h-48"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                    {enrollmentData.secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify setup.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={verificationCode.length !== 6 || verifying || generatingCodes}
            >
              {verifying || generatingCodes ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {generatingCodes ? 'Generating codes...' : 'Verifying...'}
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryCodesDialog} onOpenChange={setShowRecoveryCodesDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Save Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              If you lose access to your authenticator app, you can use these codes to sign in. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-warning bg-warning/10">
            <AlertDescription className="text-warning-foreground">
              <strong>Important:</strong> Store these codes in a safe place. You won't be able to see them again.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="px-2 py-1 bg-background rounded">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyRecoveryCodes}>
              {copiedCodes ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy codes
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadRecoveryCodes}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowRecoveryCodesDialog(false)}>
              I've saved my codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable 2FA? This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <ShieldOff className="h-4 w-4" />
            <AlertDescription>
              Disabling 2FA removes the extra security layer from your account. Your recovery codes will also be invalidated.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisable} 
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
