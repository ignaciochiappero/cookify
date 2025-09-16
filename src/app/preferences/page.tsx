'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Food } from '@/types/food';
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

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las verduras
      const foodsResponse = await fetch('/api/food');
      const foodsResult = await foodsResponse.json();
      
      if (foodsResult.success) {
        setAllFoods(foodsResult.data || []);
      }

      // Obtener preferencias del usuario
      const prefsResponse = await fetch('/api/user/preferences');
      const prefsResult = await prefsResponse.json();
      
      if (prefsResult.success) {
        setPreferences(prefsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getPreferenceForFood = (foodId: string) => {
    return preferences.find(p => p.foodId === foodId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🛒 Mis Preferencias de Ingredientes
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Selecciona los ingredientes que tienes disponibles en tu cocina
          </p>
        </div>

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

        {allFoods.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🥬</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay verduras disponibles
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Ejecuta el seed para agregar verduras a la base de datos
            </p>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
