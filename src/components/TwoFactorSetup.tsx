/**
 * @fileoverview Two-Factor Authentication setup component using TOTP.
 * Allows users to enroll, verify, and manage 2FA for their account.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle } from 'lucide-react';
import { Factor } from '@supabase/supabase-js';

export function TwoFactorSetup() {
  const { user, enrollTOTP, verifyTOTP, unenrollTOTP, getMFAFactors } = useAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{ qr: string; secret: string; factorId: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copied, setCopied] = useState(false);

  const hasVerifiedFactor = factors.some(f => f.status === 'verified');

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { factors: loadedFactors } = await getMFAFactors();
    setFactors(loadedFactors);
    setLoading(false);
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
      setShowEnrollDialog(false);
      setEnrollmentData(null);
      setVerificationCode('');
      await loadFactors();
    }
    setVerifying(false);
  };

  const handleDisable = async () => {
    const verifiedFactor = factors.find(f => f.status === 'verified');
    if (!verifiedFactor || disableCode.length !== 6) return;

    setVerifying(true);
    const { error } = await unenrollTOTP(verifiedFactor.id);
    
    if (!error) {
      setShowDisableDialog(false);
      setDisableCode('');
      await loadFactors();
    }
    setVerifying(false);
  };

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
              disabled={verificationCode.length !== 6 || verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
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
              Disabling 2FA removes the extra security layer from your account.
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
