import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (status === 'unauthenticated') {
        setLoading(false);
        return;
      }

      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.status === 404) {
            // Usuario no tiene preferencias, necesita onboarding
            setNeedsOnboarding(true);
          } else if (response.ok) {
            // Usuario tiene preferencias, no necesita onboarding
            setNeedsOnboarding(false);
          } else {
            // Error al verificar preferencias
            setNeedsOnboarding(false);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setNeedsOnboarding(false);
        }
      }

      setLoading(false);
    };

    checkOnboardingStatus();
  }, [status, session]);

  const redirectToOnboarding = () => {
    router.push('/onboarding');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    needsOnboarding,
    loading,
    redirectToOnboarding,
    redirectToDashboard,
  };
}
