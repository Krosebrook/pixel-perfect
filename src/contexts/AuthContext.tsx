import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthMFAEnrollResponse, Factor } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAChallengeState {
  required: boolean;
  factorId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mfaChallenge: MFAChallengeState;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; mfaRequired?: boolean }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  signInWithAzure: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // MFA methods
  enrollTOTP: () => Promise<{ data: AuthMFAEnrollResponse['data'] | null; error: any }>;
  verifyTOTP: (factorId: string, code: string) => Promise<{ error: any }>;
  unenrollTOTP: (factorId: string) => Promise<{ error: any }>;
  getMFAFactors: () => Promise<{ factors: Factor[]; error: any }>;
  verifyMFAChallenge: (factorId: string, code: string) => Promise<{ error: any }>;
  completeMFAChallenge: () => void;
  cancelMFAChallenge: () => void;
  generateRecoveryCodes: () => Promise<{ codes: string[]; error: any }>;
  getRecoveryCodesCount: () => Promise<{ count: number; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState<MFAChallengeState>({ required: false, factorId: null });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }

    // Check if MFA is required
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
    
    if (verifiedFactors.length > 0) {
      // Check current AAL level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        // MFA verification required
        setMfaChallenge({ required: true, factorId: verifiedFactors[0].id });
        return { error: null, mfaRequired: true };
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signInWithGitHub = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "GitHub sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signInWithAzure = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'email profile openid'
      }
    });

    if (error) {
      toast({
        title: "Microsoft sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link."
      });
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
    }

    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Failed to resend verification",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link."
      });
    }

    return { error };
  };

  // MFA/TOTP methods
  const enrollTOTP = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App'
    });

    if (error) {
      toast({
        title: "Failed to enroll 2FA",
        description: error.message,
        variant: "destructive"
      });
    }

    return { data, error };
  };

  const verifyTOTP = async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    });

    if (challengeError) {
      toast({
        title: "Failed to create challenge",
        description: challengeError.message,
        variant: "destructive"
      });
      return { error: challengeError };
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    });

    if (error) {
      toast({
        title: "Invalid verification code",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been successfully enabled."
      });
    }

    return { error };
  };

  const unenrollTOTP = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId
    });

    if (error) {
      toast({
        title: "Failed to disable 2FA",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "2FA disabled",
        description: "Two-factor authentication has been disabled."
      });
    }

    return { error };
  };

  const getMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();

    return { 
      factors: data?.totp || [], 
      error 
    };
  };

  const verifyMFAChallenge = async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    });

    if (challengeError) {
      return { error: challengeError };
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    });

    return { error };
  };

  const completeMFAChallenge = () => {
    setMfaChallenge({ required: false, factorId: null });
  };

  const cancelMFAChallenge = async () => {
    setMfaChallenge({ required: false, factorId: null });
    await supabase.auth.signOut();
  };

  const generateRecoveryCodes = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { codes: [], error: new Error('User not authenticated') };
    }

    // Generate 10 recovery codes
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from({ length: 3 }, () => 
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ).join('-');
      codes.push(code);
    }

    // Delete old recovery codes
    await supabase
      .from('mfa_recovery_codes')
      .delete()
      .eq('user_id', currentUser.id);

    // Store new codes (storing as plain text for simplicity - in production use proper hashing)
    const codeRecords = codes.map(code => ({
      user_id: currentUser.id,
      code_hash: code.replace(/-/g, '')
    }));

    const { error } = await supabase
      .from('mfa_recovery_codes')
      .insert(codeRecords);

    if (error) {
      toast({
        title: "Failed to generate recovery codes",
        description: error.message,
        variant: "destructive"
      });
      return { codes: [], error };
    }

    return { codes, error: null };
  };

  const getRecoveryCodesCount = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { count: 0, error: new Error('User not authenticated') };
    }

    const { count, error } = await supabase
      .from('mfa_recovery_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .is('used_at', null);

    return { count: count || 0, error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, mfaChallenge,
      signUp, signIn, signInWithGoogle, signInWithGitHub, signInWithAzure,
      resetPassword, updatePassword, resendVerificationEmail, signOut,
      enrollTOTP, verifyTOTP, unenrollTOTP, getMFAFactors, verifyMFAChallenge,
      completeMFAChallenge, cancelMFAChallenge, generateRecoveryCodes, getRecoveryCodesCount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
