'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Food } from '@/types/food';
import { RecipeIngredient } from '@/types/recipe';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

interface UserPreference {
  id: string;
  foodId: string;
  isAvailable: boolean;
  food: Food;
}

export default function Preferences() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todas las verduras
      const foodsResponse = await fetch('/api/food');
      const foodsResult = await foodsResponse.json();
      
      if (foodsResult.success) {
        setAllFoods(foodsResult.data || []);
      } else {
        setError('Error al cargar los ingredientes');
      }

      // Obtener preferencias del usuario
      const prefsResponse = await fetch('/api/user/preferences');
      const prefsResult = await prefsResponse.json();
      
      if (prefsResult.success) {
        setPreferences(prefsResult.data || []);
      } else {
        setError('Error al cargar las preferencias');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error de conexión al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (foodId: string, isAvailable: boolean) => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodId,
          isAvailable: !isAvailable
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar el estado local
        setPreferences(prev => {
          const existing = prev.find(p => p.foodId === foodId);
          if (existing) {
            return prev.map(p => 
              p.foodId === foodId 
                ? { ...p, isAvailable: !isAvailable }
                : p
            );
          } else {
            // Agregar nueva preferencia
            const food = allFoods.find(f => f.id === foodId);
            if (food) {
              return [...prev, {
                id: result.data.id,
                foodId,
                isAvailable: !isAvailable,
                food
              }];
            }
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error updating preference:', error);
    } finally {
      setSaving(false);
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

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error al cargar los datos
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getPreferenceForFood = (foodId: string) => {
    return preferences.find(p => p.foodId === foodId);
  };

  const getSelectedIngredients = (): RecipeIngredient[] => {
    return preferences
      .filter(p => p.isAvailable)
      .map(p => ({
        id: p.food.id,
        name: p.food.name,
        image: p.food.image
      }));
  };

  const generateRecipe = async () => {
    const selectedIngredients = getSelectedIngredients();
    
    if (selectedIngredients.length === 0) {
      alert('Por favor selecciona al menos un ingrediente para generar una receta');
      return;
    }

    try {
      setGeneratingRecipe(true);
      
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: selectedIngredients
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('¡Receta generada exitosamente! Revisa tu lista de recetas.');
        // Aquí podrías redirigir a una página de recetas o mostrar la receta
      } else {
        alert(result.error || 'Error al generar la receta');
      }
    } catch {
      alert('Error de conexión al generar la receta');
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🛒 Mis Preferencias de Ingredientes
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Selecciona los ingredientes que tienes disponibles en tu cocina
              </p>
            </div>
            <button
              onClick={generateRecipe}
              disabled={generatingRecipe || getSelectedIngredients().length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {generatingRecipe ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  🤖 Generar Receta
                </>
              )}
            </button>
          </div>
          
          {getSelectedIngredients().length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                <strong>Ingredientes seleccionados:</strong> {getSelectedIngredients().map(ing => ing.name).join(', ')}
              </p>
            </div>
          )}
        </div>

        {allFoods.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🥬</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay ingredientes disponibles
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Contacta al administrador para agregar ingredientes
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allFoods.map((food) => {
            const preference = getPreferenceForFood(food.id);
            const isAvailable = preference?.isAvailable || false;

            return (
              <div
                key={food.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-2 transition-all duration-200 ${
                  isAvailable 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {food.name}
                  </h3>
                  <button
                    onClick={() => togglePreference(food.id, isAvailable)}
                    disabled={saving}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                      isAvailable
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                    }`}
                  >
                    {isAvailable && <span className="text-xs">✓</span>}
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {food.description}
                </p>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isAvailable ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ✓ Disponible
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      No disponible
                    </span>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
