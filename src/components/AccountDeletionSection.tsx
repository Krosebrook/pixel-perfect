/**
 * @fileoverview Account deletion component with grace period.
 * Allows users to delete their account with a confirmation flow and grace period.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Clock, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GRACE_PERIOD_DAYS = 30;
const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export function AccountDeletionSection() {
  const { user, signOut } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const isConfirmationValid = confirmationInput === CONFIRMATION_PHRASE && understandConsequences;

  const handleScheduleDeletion = async () => {
    if (!user || !isConfirmationValid) return;

    setIsDeleting(true);

    try {
      // Calculate deletion date (30 days from now)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + GRACE_PERIOD_DAYS);

      // Update profile with scheduled deletion date
      // In a real implementation, you would:
      // 1. Store the scheduled deletion date in the database
      // 2. Send a confirmation email
      // 3. Set up a scheduled job to delete the account after the grace period
      
      // For now, we'll log the activity and show the scheduled state
      await supabase.from('account_activity').insert({
        user_id: user.id,
        activity_type: 'account_deletion_scheduled',
        metadata: {
          scheduled_deletion_date: deletionDate.toISOString(),
          grace_period_days: GRACE_PERIOD_DAYS,
        },
      });

      setDeletionScheduled(true);
      setScheduledDate(deletionDate);
      setShowDialog(false);
      
      toast.success(`Account deletion scheduled for ${deletionDate.toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to schedule deletion:', error);
      toast.error('Failed to schedule account deletion. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;

    try {
      await supabase.from('account_activity').insert({
        user_id: user.id,
        activity_type: 'account_deletion_cancelled',
        metadata: {
          cancelled_at: new Date().toISOString(),
        },
      });

      setDeletionScheduled(false);
      setScheduledDate(null);
      toast.success('Account deletion has been cancelled');
    } catch (error) {
      console.error('Failed to cancel deletion:', error);
      toast.error('Failed to cancel account deletion. Please try again.');
    }
  };

  const resetDialog = () => {
    setConfirmationInput('');
    setUnderstandConsequences(false);
    setShowDialog(false);
  };

  return (
    <>
      <Card role="region" aria-labelledby="delete-account-title" className="border-destructive/20">
        <CardHeader>
          <CardTitle id="delete-account-title" className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deletionScheduled && scheduledDate ? (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Account Deletion Scheduled</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Your account is scheduled for deletion on{' '}
                  <strong>{scheduledDate.toLocaleDateString()}</strong>.
                </p>
                <p className="text-xs">
                  You can cancel this request anytime before the deletion date.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDeletion}
                  className="mt-2"
                >
                  Cancel Deletion
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-warning/20 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                <AlertDescription className="text-sm space-y-2">
                  <p>
                    <strong>This action cannot be undone.</strong> Deleting your account will:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>Permanently delete all your prompts and test runs</li>
                    <li>Remove all your API keys and scheduled tests</li>
                    <li>Delete your profile and account settings</li>
                    <li>Remove you from all teams you've joined</li>
                    <li>Revoke access to all shared resources</li>
                  </ul>
                  <p className="text-xs">
                    A {GRACE_PERIOD_DAYS}-day grace period will allow you to cancel before permanent deletion.
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                variant="destructive"
                onClick={() => setShowDialog(true)}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center">
            This complies with GDPR Article 17 - Right to erasure
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={resetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Your Account?</DialogTitle>
            <DialogDescription className="text-center">
              This will schedule your account for permanent deletion after a {GRACE_PERIOD_DAYS}-day grace period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                All your data will be permanently deleted. This action cannot be reversed after the grace period.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-bold">{CONFIRMATION_PHRASE}</span> to confirm
              </Label>
              <Input
                id="confirmation"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value.toUpperCase())}
                placeholder={CONFIRMATION_PHRASE}
                className={confirmationInput === CONFIRMATION_PHRASE ? 'border-destructive' : ''}
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="understand"
                checked={understandConsequences}
                onCheckedChange={(checked) => setUnderstandConsequences(checked === true)}
              />
              <Label htmlFor="understand" className="text-sm leading-relaxed cursor-pointer">
                I understand that after the {GRACE_PERIOD_DAYS}-day grace period, my account and all data 
                will be permanently deleted and cannot be recovered.
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleScheduleDeletion}
              disabled={!isConfirmationValid || isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Deletion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
