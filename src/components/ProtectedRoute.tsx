'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Aún cargando

    if (!session) {
      // No autenticado, redirigir al login
      router.push('/auth/signin');
      return;
    }

    if (requiredRole && session.user?.role !== requiredRole) {
      // Rol insuficiente, redirigir al dashboard
      router.push('/');
      return;
    }
  }, [session, status, router, requiredRole]);

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // No autenticado
  if (!session) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Necesitas iniciar sesión para acceder a esta página
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Rol insuficiente
  if (requiredRole && session.user?.role !== requiredRole) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No tienes permisos para acceder a esta página
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos suficientes
  return <>{children}</>;
}
