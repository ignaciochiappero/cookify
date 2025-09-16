'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              👑 Panel de Administración
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Bienvenido, {session?.user?.name}. Aquí puedes gestionar el sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Estadísticas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Estadísticas del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Usuarios totales:</span>
                  <span className="font-medium text-gray-900 dark:text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Verduras disponibles:</span>
                  <span className="font-medium text-gray-900 dark:text-white">10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Preferencias guardadas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">0</span>
                </div>
              </div>
            </div>

            {/* Gestión de Usuarios */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                👥 Gestión de Usuarios
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Administra usuarios y sus roles
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Ver Usuarios
              </button>
            </div>

            {/* Gestión de Contenido */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🥬 Gestión de Verduras
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Administra el catálogo de verduras
              </p>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Gestionar Verduras
              </button>
            </div>

            {/* Configuración del Sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ⚙️ Configuración
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configuración general del sistema
              </p>
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Configurar
              </button>
            </div>

            {/* Logs del Sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📋 Logs del Sistema
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Revisa la actividad del sistema
              </p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Ver Logs
              </button>
            </div>

            {/* Backup y Restauración */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💾 Backup
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Respalda y restaura datos
              </p>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Gestionar Backup
              </button>
            </div>
          </div>

          {/* Información del Usuario Admin */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ℹ️ Información de la Sesión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Usuario:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {session?.user?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Email:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {session?.user?.email}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Rol:</span>
                <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                  👑 {session?.user?.role}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">ID:</span>
                <span className="ml-2 font-mono text-sm text-gray-900 dark:text-white">
                  {session?.user?.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
