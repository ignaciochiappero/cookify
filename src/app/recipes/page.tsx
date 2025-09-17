'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Users, 
  ChefHat, 
  Sparkles, 
  Calendar,
  ArrowRight,
  Plus,
  Star,
  Timer,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Recipe } from '@/types/recipe';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function Recipes() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchRecipes();
    }
  }, [session]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes');
      const result = await response.json();
      
      if (result.success) {
        setRecipes(result.data || []);
      }
    } catch {
      console.error('Error fetching recipes');
    } finally {
      setLoading(false);
    }
  };

  const formatIngredients = (ingredientsJson: string) => {
    try {
      const ingredients = JSON.parse(ingredientsJson) as Array<{ name: string }>;
      return ingredients;
    } catch {
      return [];
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
        return 'bg-green-100 text-green-700';
      case 'medio':
        return 'bg-yellow-100 text-yellow-700';
      case 'difícil':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">Cargando tus recetas...</p>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-primary-100 p-4 rounded-2xl"
              >
                <BookOpen className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mis Recetas Generadas
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Recetas creadas con IA basadas en tus ingredientes disponibles
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{recipes.length}</div>
                  <div className="text-gray-700">Recetas creadas</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-100 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-gray-700">Generadas con IA</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">∞</div>
                  <div className="text-gray-700">Posibilidades</div>
                </div>
              </div>
            </div>
          </motion.div>

          {recipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <BookOpen className="w-12 h-12 text-primary-600" />
              </motion.div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                ¡Aún no tienes recetas!
              </h2>
              <p className="text-gray-700 mb-8 max-w-md mx-auto">
                Ve a tu dashboard, selecciona ingredientes y genera tu primera receta con IA
              </p>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
              >
                <ChefHat className="w-5 h-5" />
                <span>Ir al Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <AnimatePresence>
                {recipes.map((recipe, index) => {
                  const ingredients = formatIngredients(recipe.ingredients);
                  
                  return (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-300 overflow-hidden border border-primary-200"
                    >
                      {/* Recipe Header */}
                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2 line-clamp-2">
                              {recipe.title}
                            </h3>
                            <p className="text-primary-100 text-sm line-clamp-2">
                              {recipe.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                              <ChefHat className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Recipe Meta */}
                        <div className="flex flex-wrap gap-3">
                          {recipe.cookingTime && (
                            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">{recipe.cookingTime} min</span>
                            </div>
                          )}
                          
                          {recipe.servings && (
                            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">{recipe.servings} porciones</span>
                            </div>
                          )}
                          
                          {recipe.difficulty && (
                            <div className={`flex items-center space-x-1 rounded-lg px-3 py-1 ${getDifficultyColor(recipe.difficulty)}`}>
                              <Target className="w-4 h-4" />
                              <span className="text-sm font-medium">{recipe.difficulty}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recipe Content */}
                      <div className="p-6">
                        {/* Ingredients */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <ChefHat className="w-5 h-5 mr-2 text-primary-600" />
                            Ingredientes
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ingredients.map((ingredient, idx) => (
                              <span
                                key={idx}
                                className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {ingredient.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Timer className="w-5 h-5 mr-2 text-primary-600" />
                            Preparación
                          </h4>
                          <div className="bg-gray-100 rounded-xl p-4">
                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                              {recipe.instructions}
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(recipe.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-accent-600">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Generada con IA</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CTA Section */}
          {recipes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="bg-white rounded-2xl p-8 shadow-soft border border-primary-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Quieres crear más recetas?
                </h3>
                <p className="text-gray-700 mb-6">
                  Ve a tu dashboard y experimenta con diferentes combinaciones de ingredientes
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Nueva Receta</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
