'use client';

import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Sparkles, 
  ArrowRight, 
  Check,
  Zap,
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function PlansPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const pricingPlans = [
    {
      id: "free",
      name: "Free",
      price: "Gratis",
      description: "Perfecto para empezar",
      features: [
        "Generación de 4 recetas diarias",
        "1 foto por día para subir la alacena",
        "1 juntada (eventos con amigos)"
      ],
      icon: ChefHat,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      buttonText: "Plan Actual",
      buttonStyle: "bg-gray-100 text-gray-600 cursor-not-allowed",
      disabled: true
    },
    {
      id: "plus",
      name: "Plus",
      price: "$9.99",
      period: "/mes",
      description: "Para cocineros entusiastas",
      features: [
        "Generación de 12 recetas diarias",
        "Límite de 7 fotos diarias",
        "3 juntadas semanales"
      ],
      icon: Sparkles,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
      buttonText: "Elegir Plus",
      buttonStyle: "bg-primary-600 hover:bg-primary-700 text-white",
      popular: true
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19.99",
      period: "/mes",
      description: "Para chefs profesionales",
      features: [
        "Generación de recetas ilimitadas",
        "Fotos ilimitadas",
        "Juntadas ilimitadas"
      ],
      icon: Zap,
      color: "text-accent-600",
      bgColor: "bg-accent-50",
      borderColor: "border-accent-200",
      buttonText: "Elegir Pro",
      buttonStyle: "bg-accent-600 hover:bg-accent-700 text-white"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') return;
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePayment = () => {
    // Simular proceso de pago
    setTimeout(() => {
      window.location.href = '/plans/success';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Header */}
      <section className="py-20 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Elige tu Plan Perfecto
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Desde principiantes hasta chefs profesionales, tenemos el plan ideal para ti
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className={`relative bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border-2 ${
                  plan.popular 
                    ? 'border-primary-300 ring-2 ring-primary-100' 
                    : plan.borderColor
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl ${plan.bgColor} mb-4`}>
                    <plan.icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={plan.disabled}
                  className={`w-full flex items-center justify-center gap-2 font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong ${plan.buttonStyle} ${
                    plan.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {plan.buttonText}
                  {!plan.disabled && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-strong"
          >
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-primary-50 mb-4">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Procesar Pago
              </h3>
              <p className="text-gray-600">
                Simulación de pago con Stripe
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Plan seleccionado:</span>
                  <span className="font-bold text-primary-600">
                    {pricingPlans.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Precio:</span>
                  <span className="font-bold text-gray-900">
                    {pricingPlans.find(p => p.id === selectedPlan)?.price}
                    {pricingPlans.find(p => p.id === selectedPlan)?.period}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Pago seguro con Stripe</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Activación inmediata</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
              >
                Pagar Ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 text-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Cookify</h3>
            <p className="text-gray-600 mb-6">
              Tu asistente de cocina con inteligencia artificial
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-600">
              <span>© 2024 Cookify</span>
              <span>•</span>
              <span>Hecho con ❤️ y IA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
