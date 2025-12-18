import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { MFAChallengeDialog } from '@/components/MFAChallengeDialog';

export default function Auth() {
  const { user, mfaChallenge, completeMFAChallenge, cancelMFAChallenge } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !mfaChallenge.required) {
      navigate('/', { replace: true });
    }
  }, [user, mfaChallenge.required, navigate]);

  const handleMFASuccess = () => {
    completeMFAChallenge();
    navigate('/', { replace: true });
  };

  return (
    <>
      <AuthForm />
      <MFAChallengeDialog
        open={mfaChallenge.required}
        factorId={mfaChallenge.factorId || ''}
        onSuccess={handleMFASuccess}
        onCancel={cancelMFAChallenge}
      />
    </>
  );
}
