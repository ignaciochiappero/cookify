'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
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
      return ingredients.map((ing) => ing.name).join(', ');
    } catch {
      return 'Ingredientes no disponibles';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📚 Mis Recetas Generadas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Recetas creadas con IA basadas en tus ingredientes disponibles
            </p>
          </div>

          {recipes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No tienes recetas generadas aún
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ve a tus preferencias, selecciona ingredientes y genera tu primera receta
              </p>
              <a
                href="/preferences"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Ir a Preferencias
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {recipe.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {recipe.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium mr-2">Ingredientes:</span>
                        <span className="truncate">{formatIngredients(recipe.ingredients)}</span>
                      </div>
                      
                      {recipe.cookingTime && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium mr-2">⏱️ Tiempo:</span>
                          <span>{recipe.cookingTime} minutos</span>
                        </div>
                      )}
                      
                      {recipe.difficulty && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium mr-2">📊 Dificultad:</span>
                          <span>{recipe.difficulty}</span>
                        </div>
                      )}
                      
                      {recipe.servings && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium mr-2">👥 Porciones:</span>
                          <span>{recipe.servings}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Instrucciones:
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                        {recipe.instructions}
                      </p>
                    </div>

                    <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                      Generada el {new Date(recipe.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
