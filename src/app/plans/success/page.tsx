'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  ArrowRight, 
  ChefHat,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function PaymentSuccessPage() {
  const [planName, setPlanName] = useState('Plus');

  useEffect(() => {
    // Simular obtención del plan desde localStorage o URL params
    const savedPlan = localStorage.getItem('selectedPlan') || 'Plus';
    setPlanName(savedPlan);
  }, []);

  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'plus':
        return Sparkles;
      case 'pro':
        return Zap;
      default:
        return ChefHat;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'plus':
        return 'text-primary-600';
      case 'pro':
        return 'text-accent-600';
      default:
        return 'text-gray-600';
    }
  };

  const PlanIcon = getPlanIcon(planName);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-strong border border-gray-200"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex p-4 rounded-full bg-green-100 mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Pago Exitoso!
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Tu suscripción ha sido activada correctamente
            </p>
          </motion.div>

          {/* Plan Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-gray-50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex p-2 rounded-lg bg-white">
                <PlanIcon className={`w-6 h-6 ${getPlanColor(planName)}`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Plan {planName} Activado
              </h2>
            </div>
            <p className="text-gray-600">
              Ya puedes disfrutar de todas las funcionalidades de tu nuevo plan
            </p>
          </motion.div>

          {/* Features Unlocked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Funcionalidades desbloqueadas:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {planName === 'Plus' && (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>12 recetas diarias</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>7 fotos diarias</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>3 juntadas semanales</span>
                  </div>
                </>
              )}
              {planName === 'Pro' && (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Recetas ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Fotos ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Juntadas ilimitadas</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
            >
              <ChefHat className="w-5 h-5" />
              Ir al Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/recipes"
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Ver Mis Recetas
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <p className="text-sm text-gray-600">
              Recibirás un email de confirmación en los próximos minutos.
              <br />
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </motion.div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
