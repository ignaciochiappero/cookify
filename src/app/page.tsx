'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  const features = [
    {
      icon: ChefHat,
      title: "Selección Inteligente",
      description: "Marca los ingredientes disponibles en tu cocina de forma intuitiva",
      color: "text-primary-600"
    },
    {
      icon: Sparkles,
      title: "IA Generativa",
      description: "Nuestra IA crea recetas personalizadas con tus ingredientes",
      color: "text-accent-600"
    },
    {
      icon: BookOpen,
      title: "Biblioteca Personal",
      description: "Guarda y organiza todas tus recetas generadas",
      color: "text-primary-600"
    }
  ];

  const stats = [
    { number: "8+", label: "Ingredientes Base" },
    { number: "∞", label: "Recetas Posibles" },
    { number: "100%", label: "Personalizado" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-primary-100 p-4 rounded-2xl"
              >
                <ChefHat className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Tu Asistente de
              <span className="text-primary-600 block">Cocina con IA</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Genera recetas deliciosas y personalizadas con los ingredientes que tienes en casa. 
              Nuestra inteligencia artificial creará combinaciones perfectas para ti.
            </p>

            {session ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft max-w-md mx-auto">
                  <p className="text-gray-700 mb-4">
                    ¡Bienvenido de vuelta, <span className="font-semibold text-primary-600">{session.user?.name}</span>! 👋
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                    >
                      <ChefHat className="w-5 h-5" />
                      Mi Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/recipes"
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                    >
                      <BookOpen className="w-5 h-5" />
                      Mis Recetas
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-8 rounded-xl transition-all duration-200 shadow-soft border border-gray-200"
                >
                  <Users className="w-5 h-5" />
                  Crear Cuenta
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-soft"
              >
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona Cookify?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tres pasos simples para crear recetas increíbles
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 group"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gray-50 group-hover:bg-primary-50 transition-colors duration-300 mb-6`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="py-20 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Únete a miles de usuarios que ya están creando recetas increíbles
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-primary-600 font-medium py-4 px-8 rounded-xl transition-all duration-200 shadow-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Crear Cuenta Gratis
                </Link>
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 border border-primary-500"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Cookify</h3>
            <p className="text-gray-400 mb-6">
              Tu asistente de cocina con inteligencia artificial
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
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