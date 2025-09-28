'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OnboardingSurvey from '@/components/OnboardingSurvey';
import { OnboardingData } from '@/types/user-preferences';

export default function OnboardingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
  }, [status, router]);

  const handleComplete = async (data: OnboardingData) => {
    setLoading(true);
    try {
      console.log('Enviando datos:', data);
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        console.log('Preferencias guardadas exitosamente');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        console.error('Error saving preferences:', errorData);
        alert(`Error al guardar preferencias: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error de conexión al guardar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <OnboardingSurvey 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
