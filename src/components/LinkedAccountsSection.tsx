/**
 * @fileoverview Linked accounts management section for user profile.
 * Allows users to view and manage connected login methods (email, Google).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Link2, Unlink, Mail, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Identity {
  id: string;
  provider: string;
  identity_id: string;
  created_at: string;
  last_sign_in_at?: string;
}

export function LinkedAccountsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  // Get user identities
  const { data: identities, isLoading } = useQuery({
    queryKey: ['user-identities', user?.id],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];
      
      // User identities are stored in the user object
      return (currentUser.identities || []) as Identity[];
    },
    enabled: !!user,
  });

  // Link Google account
  const linkGoogleAccount = async () => {
    setIsLinkingGoogle(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      });

      if (error) {
        toast.error('Failed to link Google account', {
          description: error.message,
        });
      }
      // If successful, user will be redirected to Google
    } catch (err: any) {
      toast.error('Failed to link Google account', {
        description: err.message || 'An unexpected error occurred',
      });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  // Unlink identity
  const unlinkMutation = useMutation({
    mutationFn: async (identity: Identity) => {
      // Use the identity object directly as Supabase expects
      const { error } = await supabase.auth.unlinkIdentity({
        id: identity.id,
        identity_id: identity.identity_id,
        provider: identity.provider,
        user_id: user?.id || '',
        created_at: identity.created_at,
        updated_at: identity.created_at,
        identity_data: {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-identities'] });
      toast.success('Account unlinked successfully');
      setShowUnlinkDialog(false);
      setSelectedIdentity(null);
    },
    onError: (error: any) => {
      toast.error('Failed to unlink account', {
        description: error.message || 'An unexpected error occurred',
      });
    },
    onSettled: () => {
      setUnlinkingId(null);
    },
  });

  const handleUnlinkClick = (identity: Identity) => {
    setSelectedIdentity(identity);
    setShowUnlinkDialog(true);
  };

  const confirmUnlink = () => {
    if (selectedIdentity) {
      setUnlinkingId(selectedIdentity.id);
      unlinkMutation.mutate(selectedIdentity);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
        );
      case 'email':
      default:
        return <Mail className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'email':
        return 'Email & Password';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const hasEmailIdentity = identities?.some(i => i.provider === 'email');
  const hasGoogleIdentity = identities?.some(i => i.provider === 'google');
  const canUnlink = (identities?.length || 0) > 1;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
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
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Manage the login methods connected to your account. You can sign in with any linked account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security tip */}
          <Alert className="border-primary/20 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Linking multiple accounts provides backup login options and makes your account more secure.
            </AlertDescription>
          </Alert>

          {/* Linked accounts list */}
          <div className="space-y-3">
            {identities?.map((identity) => (
              <div
                key={identity.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {getProviderIcon(identity.provider)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getProviderLabel(identity.provider)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(identity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {canUnlink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkClick(identity)}
                    disabled={unlinkingId === identity.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {unlinkingId === identity.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    <span className="sr-only">Unlink {getProviderLabel(identity.provider)}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Link new account options */}
          {!hasGoogleIdentity && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Link additional accounts</p>
              <Button
                variant="outline"
                onClick={linkGoogleAccount}
                disabled={isLinkingGoogle}
                className="w-full gap-2"
              >
                {isLinkingGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
                )}
                Link Google Account
              </Button>
            </div>
          )}

          {!canUnlink && identities && identities.length === 1 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              You need at least two linked accounts to unlink one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unlink {selectedIdentity && getProviderLabel(selectedIdentity.provider)}?
            </DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in using this method. 
              Make sure you have another way to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUnlinkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnlink}
              disabled={unlinkMutation.isPending}
            >
              {unlinkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Unlink Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
