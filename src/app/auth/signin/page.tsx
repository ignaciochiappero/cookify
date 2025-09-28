'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChefHat, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas');
      } else {
        // Verificar la sesión y redirigir
        const session = await getSession();
        if (session) {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-6 shadow-strong">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
              Cookify
            </h1>
            <p className="text-gray-600 text-sm">Tu asistente de cocina con IA</p>
          </motion.div>

          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-strong border border-primary-200 p-8 relative overflow-hidden"
          >
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-primary-50/30 pointer-events-none"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Bienvenido de vuelta! 👋
                  </h2>
                  <p className="text-gray-700">
                    Inicia sesión para acceder a tu cuenta
                  </p>
                </motion.div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                      placeholder="tu@email.com"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                      placeholder="Tu contraseña"
                    />
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-red-50/80 border-2 border-red-200 rounded-2xl p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-medium hover:shadow-strong disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-gray-700">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    href="/auth/signup" 
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Demo Credentials Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
              className="mt-8 bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-primary-200 shadow-soft"
          >
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-center">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                Credenciales de prueba
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-3">
                  <span className="font-medium text-gray-800">Usuario:</span>
                  <span className="text-gray-700 font-mono">demo@cookify.com / demo123</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-3">
                  <span className="font-medium text-gray-800">Admin:</span>
                  <span className="text-gray-700 font-mono">admin@cookify.com / admin123</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
