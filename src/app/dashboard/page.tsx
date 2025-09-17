'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Sparkles, 
  Save, 
  CheckCircle, 
  Clock,
  AlertCircle,
  ShoppingCart,
  Plus
} from 'lucide-react';
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

export default function Dashboard() {
  const { data: session } = useSession();
  const [, setPreferences] = useState<UserPreference[]>([]);
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localSelections, setLocalSelections] = useState<Record<string, boolean>>({});

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
        // Inicializar selecciones locales
        const initialSelections: Record<string, boolean> = {};
        prefsResult.data?.forEach((pref: UserPreference) => {
          initialSelections[pref.foodId] = pref.isAvailable;
        });
        setLocalSelections(initialSelections);
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

  const toggleLocalSelection = (foodId: string) => {
    setLocalSelections(prev => ({
      ...prev,
      [foodId]: !prev[foodId]
    }));
    setHasUnsavedChanges(true);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      // Guardar todas las preferencias
      const promises = Object.entries(localSelections).map(([foodId, isAvailable]) =>
        fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            foodId,
            isAvailable
          }),
        })
      );

      await Promise.all(promises);
      setHasUnsavedChanges(false);
      
      // Actualizar el estado local
      setPreferences(prev => 
        prev.map(p => ({
          ...p,
          isAvailable: localSelections[p.foodId] || false
        }))
      );
      
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedIngredients = (): RecipeIngredient[] => {
    return allFoods
      .filter(food => localSelections[food.id])
      .map(food => ({
        id: food.id,
        name: food.name,
        image: food.image
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
        // Redirigir a la página de recetas
        window.location.href = '/recipes';
      } else {
        alert(result.error || 'Error al generar la receta');
      }
    } catch {
      alert('Error de conexión al generar la receta');
    } finally {
      setGeneratingRecipe(false);
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
            <p className="text-gray-600">Cargando tu dashboard...</p>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Error al cargar los datos
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={fetchData}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Reintentar
              </button>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const selectedCount = Object.values(localSelections).filter(Boolean).length;

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
                <ChefHat className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Hola, {session?.user?.name}! 👋
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Selecciona los ingredientes que tienes disponibles y crea recetas increíbles con IA
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{allFoods.length}</div>
                  <div className="text-gray-700">Ingredientes disponibles</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-100 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{selectedCount}</div>
                  <div className="text-gray-700">Seleccionados</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">∞</div>
                  <div className="text-gray-700">Recetas posibles</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-soft mb-8 border border-primary-200"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  {selectedCount > 0 ? (
                    <span className="text-primary-600 font-medium">
                      {selectedCount} ingrediente{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span>Selecciona ingredientes para comenzar</span>
                  )}
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Cambios sin guardar</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {hasUnsavedChanges && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={savePreferences}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:text-primary-100 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateRecipe}
                  disabled={generatingRecipe || selectedCount === 0}
                  className="flex items-center space-x-2 bg-accent-600 hover:bg-accent-700 disabled:bg-gray-300 disabled:text-gray-100 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 shadow-medium"
                >
                  {generatingRecipe ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Receta</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Ingredients Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {allFoods.map((food, index) => {
                const isSelected = localSelections[food.id] || false;
                
                return (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className={`bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer border-2 ${
                      isSelected 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                    onClick={() => toggleLocalSelection(food.id)}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {food.name}
                      </h3>
                      
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {food.description}
                      </p>
                      
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isSelected
                          ? 'bg-primary-200 text-primary-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Agregar</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {allFoods.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🥬</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No hay ingredientes disponibles
              </h2>
              <p className="text-gray-600">
                Contacta al administrador para agregar ingredientes
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
