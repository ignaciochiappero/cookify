'use client';

import React, { useEffect } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { usePathname } from 'next/navigation';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { needsOnboarding, loading, redirectToOnboarding } = useOnboarding();
  const pathname = usePathname();

  // No aplicar el guard en páginas de auth, onboarding o profile
  const isExcludedPage = pathname.startsWith('/auth') || 
                        pathname.startsWith('/onboarding') || 
                        pathname.startsWith('/profile');

  useEffect(() => {
    if (!loading && needsOnboarding && !isExcludedPage) {
      redirectToOnboarding();
    }
  }, [needsOnboarding, loading, redirectToOnboarding, isExcludedPage]);

  // Si estamos en una página excluida, mostrar el contenido directamente
  if (isExcludedPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando perfil...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return null; // El useEffect redirigirá al onboarding
  }

  return <>{children}</>;
}
