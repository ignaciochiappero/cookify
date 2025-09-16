'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { session, isLoading, isAdmin } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🥬</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Cookify
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Inicio
            </Link>
            {session && (
              <>
                <Link 
                  href="/preferences" 
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Mis Preferencias
                </Link>
                <Link 
                  href="/recipes" 
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Mis Recetas
                </Link>
              </>
            )}
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {isAdmin ? '👑 Admin' : '👤 Usuario'}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors duration-200"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
