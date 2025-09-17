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
  Plus,
  Minus,
  Package,
  X,
  Timer,
  Users,
  Target,
  BookOpen
} from 'lucide-react';
import Confetti from 'react-confetti';
import { Food } from '@/types/food';
import { RecipeIngredient } from '@/types/recipe';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { renderIcon } from '@/lib/iconUtils';



export default function Dashboard() {
  const { data: session } = useSession();
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localSelections, setLocalSelections] = useState<Record<string, boolean>>({});
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, { quantity: number; unit: string }>>({});
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<{
    id: string;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    cookingTime: number;
    difficulty: string;
    servings: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Mapeo de unidades para mostrar nombres amigables
  const unitLabels = {
    'PIECE': 'Piezas',
    'GRAM': 'Gramos',
    'KILOGRAM': 'Kilogramos',
    'LITER': 'Litros',
    'MILLILITER': 'Mililitros',
    'CUP': 'Tazas',
    'TABLESPOON': 'Cucharadas',
    'TEASPOON': 'Cucharaditas',
    'POUND': 'Libras',
    'OUNCE': 'Onzas'
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

      // Obtener inventario del usuario
      const inventoryResponse = await fetch('/api/inventory');
      
      if (!inventoryResponse.ok) {
        console.error('Error response from inventory API:', inventoryResponse.status, inventoryResponse.statusText);
        setError(`Error al cargar el inventario: ${inventoryResponse.status}`);
        return;
      }
      
      const inventoryResult = await inventoryResponse.json();
      console.log('Inventory API response:', inventoryResult);
      
      if (inventoryResult.success) {
        // Inicializar selecciones y cantidades basadas en el inventario
        const initialSelections: Record<string, boolean> = {};
        const initialQuantities: Record<string, { quantity: number; unit: string }> = {};
        
        inventoryResult.data?.forEach((item: { foodId: string; quantity: number; unit: string }) => {
          initialSelections[item.foodId] = true;
          initialQuantities[item.foodId] = {
            quantity: item.quantity,
            unit: item.unit
          };
        });
        
        setLocalSelections(initialSelections);
        setIngredientQuantities(initialQuantities);
      } else {
        console.error('Inventory API returned error:', inventoryResult.error);
        setError(`Error al cargar el inventario: ${inventoryResult.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error de conexión al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocalSelection = (foodId: string) => {
    const isSelected = localSelections[foodId];
    const food = allFoods.find(f => f.id === foodId);
    
    setLocalSelections(prev => ({
      ...prev,
      [foodId]: !isSelected
    }));
    
    // Si se deselecciona, limpiar la cantidad
    if (isSelected) {
      setIngredientQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[foodId];
        return newQuantities;
      });
    } else {
      // Si se selecciona, inicializar con cantidad 1 y unidad por defecto del ingrediente
      setIngredientQuantities(prev => ({
        ...prev,
        [foodId]: {
          quantity: 1,
          unit: food?.unit || 'PIECE'
        }
      }));
    }
    
    setHasUnsavedChanges(true);
  };

  const updateQuantity = (foodId: string, quantity: number) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [foodId]: {
        ...prev[foodId],
        quantity: Math.max(0, quantity)
      }
    }));
    setHasUnsavedChanges(true);
  };

  const updateUnit = (foodId: string, unit: string) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [foodId]: {
        ...prev[foodId],
        unit
      }
    }));
    setHasUnsavedChanges(true);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      // Obtener inventario actual para comparar
      const currentInventoryResponse = await fetch('/api/inventory');
      const currentInventoryResult = await currentInventoryResponse.json();
      const currentInventory = currentInventoryResult.success ? currentInventoryResult.data : [];
      
      // Preparar operaciones de inventario
      const inventoryOperations: Promise<Response>[] = [];
      
      // Para cada ingrediente seleccionado
      Object.entries(localSelections).forEach(([foodId, isSelected]) => {
        if (isSelected && ingredientQuantities[foodId]) {
          const quantity = ingredientQuantities[foodId];
          const existingItem = currentInventory.find((item: { foodId: string }) => item.foodId === foodId);
          
          if (existingItem) {
            // Actualizar item existente
            inventoryOperations.push(
              fetch(`/api/inventory/${existingItem.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  quantity: quantity.quantity,
                  unit: quantity.unit
                }),
              })
            );
          } else {
            // Crear nuevo item
            inventoryOperations.push(
              fetch('/api/inventory', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  foodId,
                  quantity: quantity.quantity,
                  unit: quantity.unit
                }),
              })
            );
          }
        } else if (!isSelected) {
          // Eliminar item si no está seleccionado
          const existingItem = currentInventory.find((item: { foodId: string }) => item.foodId === foodId);
          if (existingItem) {
            inventoryOperations.push(
              fetch(`/api/inventory/${existingItem.id}`, {
                method: 'DELETE',
              })
            );
          }
        }
      });
      
      await Promise.all(inventoryOperations);
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Error saving inventory:', error);
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
        // Mostrar confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Mostrar modal con la receta
        setGeneratedRecipe(result.data);
        setShowRecipeModal(true);
      } else {
        alert(result.error || 'Error al generar la receta');
      }
    } catch {
      alert('Error de conexión al generar la receta');
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setGeneratedRecipe(null);
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
                    className={`bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border-2 ${
                      isSelected 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-primary-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                        {renderIcon(food.icon, "w-8 h-8 text-gray-600")}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {food.name}
                      </h3>
                      
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {food.description}
                      </p>
                      
                      {/* Default Unit Info */}
                      <div className="flex items-center justify-center space-x-1 mb-4">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Unidad: {unitLabels[food.unit as keyof typeof unitLabels] || 'Piezas'}
                        </span>
                      </div>
                      
                      {/* Selection Toggle */}
                      <div 
                        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-200 text-primary-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => toggleLocalSelection(food.id)}
                      >
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

                      {/* Quantity Controls - Only show when selected */}
                      {isSelected && ingredientQuantities[food.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3"
                        >
                          {/* Quantity Input */}
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(food.id, ingredientQuantities[food.id].quantity - 1);
                              }}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <input
                              type="number"
                              value={ingredientQuantities[food.id].quantity}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateQuantity(food.id, parseInt(e.target.value) || 0);
                              }}
                              className="w-16 text-center px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                            />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(food.id, ingredientQuantities[food.id].quantity + 1);
                              }}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Unit Selector */}
                          <div className="flex items-center justify-center space-x-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <select
                              value={ingredientQuantities[food.id].unit}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateUnit(food.id, e.target.value);
                              }}
                              className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {Object.entries(unitLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      )}
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

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Recipe Modal */}
      <AnimatePresence>
        {showRecipeModal && generatedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-strong border border-primary-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-3 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      ¡Receta Generada!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tu nueva receta está lista
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRecipeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Recipe Content */}
              <div className="space-y-6">
                {/* Recipe Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 rounded-2xl text-white">
                  <h2 className="text-3xl font-bold mb-2">{generatedRecipe.title}</h2>
                  <p className="text-primary-100 text-lg">{generatedRecipe.description}</p>
                  
                  {/* Recipe Meta */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {generatedRecipe.cookingTime && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{generatedRecipe.cookingTime} min</span>
                      </div>
                    )}
                    
                    {generatedRecipe.servings && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">{generatedRecipe.servings} porciones</span>
                      </div>
                    )}
                    
                    {generatedRecipe.difficulty && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Target className="w-5 h-5" />
                        <span className="font-medium">{generatedRecipe.difficulty}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                    <ChefHat className="w-5 h-5 mr-2 text-primary-600" />
                    Ingredientes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {JSON.parse(generatedRecipe.ingredients).map((ingredient: { name: string }, idx: number) => (
                      <div
                        key={idx}
                        className="bg-primary-50 border border-primary-200 rounded-lg p-3"
                      >
                        <span className="text-primary-800 font-medium">{ingredient.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                    <Timer className="w-5 h-5 mr-2 text-primary-600" />
                    Preparación
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {generatedRecipe.instructions}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={closeRecipeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      closeRecipeModal();
                      window.location.href = '/recipes';
                    }}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Ver Todas las Recetas</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}
