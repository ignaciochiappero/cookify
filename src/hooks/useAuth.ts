'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  const isAuthenticated = !!session;
  const isLoading = status === 'loading';
  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isUser,
    hasRole: (role: 'USER' | 'ADMIN') => user?.role === role,
  };
}
