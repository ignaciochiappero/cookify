'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface DetectedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  confidence: number;
}

interface Food {
  id: string;
  name: string;
  description: string;
  image: string;
  icon?: string;
  category: string;
  unit: string;
}

interface ImageAnalyzerProps {
  onIngredientsDetected: (ingredients: DetectedIngredient[]) => void;
  onMealPlanGenerated: (mealPlan: unknown[]) => void;
  currentInventory: unknown[];
}

interface InventoryItem {
  food?: {
    name: string;
    category: string;
  };
  name?: string;
  quantity: number;
  unit: string;
  category?: string;
}

export default function ImageAnalyzer({ 
  onIngredientsDetected, 
  onMealPlanGenerated,
  currentInventory 
}: ImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [error, setError] = useState('');
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<DetectedIngredient[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [planningDays, setPlanningDays] = useState(3);
  const [showIngredientReview, setShowIngredientReview] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<number | null>(null);
  const [newIngredient, setNewIngredient] = useState<Partial<DetectedIngredient>>({});
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);
  const [ingredientsAdded, setIngredientsAdded] = useState(false);

  // Cargar alimentos disponibles al montar el componente
  useEffect(() => {
    fetchAvailableFoods();
  }, []);

  const fetchAvailableFoods = async () => {
    try {
      const response = await fetch('/api/food');
      const result = await response.json();
      if (result.success) {
        setAvailableFoods(result.data || []);
      }
    } catch (error) {
      console.error('Error al cargar alimentos:', error);
    }
  };

  const findMatchingFood = (ingredientName: string): Food | null => {
    const normalizedName = ingredientName.toLowerCase().trim();
    
    // Buscar coincidencia exacta
    let match = availableFoods.find(food => 
      food.name.toLowerCase() === normalizedName
    );
    
    if (match) return match;
    
    // Buscar coincidencia parcial
    match = availableFoods.find(food => 
      food.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(food.name.toLowerCase())
    );
    
    if (match) return match;
    
    // Buscar por palabras clave
    const keywords = normalizedName.split(' ');
    match = availableFoods.find(food => 
      keywords.some(keyword => 
        food.name.toLowerCase().includes(keyword) && keyword.length > 2
      )
    );
    
    return match || null;
  };

  const addIngredientsToInventory = async () => {
    setIsAddingToInventory(true);
    try {
      if (missingIngredients.length === 0) {
        setError('No hay ingredientes seleccionados para agregar al inventario');
        setIsAddingToInventory(false);
        return;
      }
      
      const promises = missingIngredients.map(async (ingredient) => {
        const matchingFood = findMatchingFood(ingredient.name);
        
        if (matchingFood) {
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              foodId: matchingFood.id,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              notes: `Agregado desde análisis de imagen - ${ingredient.name}`
            })
          });
          
          if (!response.ok) {
            throw new Error(`Error al agregar ${ingredient.name}`);
          }
          
          return response.json();
        } else {
          console.warn(`No se encontró coincidencia para: ${ingredient.name}`);
          return null;
        }
      });

      await Promise.all(promises);
      
      // Notificar al componente padre que se agregaron ingredientes
      onIngredientsDetected(missingIngredients);
      
      // Marcar que los ingredientes fueron agregados
      setIngredientsAdded(true);
      
      // Limpiar la lista de ingredientes faltantes
      setMissingIngredients([]);
      
    } catch (error) {
      console.error('Error al agregar ingredientes al inventario:', error);
      setError('Error al agregar algunos ingredientes al inventario');
    } finally {
      setIsAddingToInventory(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB');
        return;
      }

      setSelectedImage(file);
      setError('');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('inventory', JSON.stringify(currentInventory));

      const response = await fetch('/api/analyze-ingredients', {
        method: 'POST',
        body: formData,
        // Timeout más largo para análisis de imágenes (60 segundos)
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error('Error al analizar la imagen');
      }

      const data = await response.json();
      
      setDetectedIngredients(data.detectedIngredients || []);
      setMissingIngredients(data.missingIngredients || []);
      setSuggestions(data.suggestions || []);
      setShowIngredientReview(true);

    } catch (error) {
      console.error('Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setError('El análisis está tardando más de lo esperado. Por favor, intenta con una imagen más pequeña o intenta de nuevo.');
        } else if (error.message.includes('JSON')) {
          setError('Error procesando la respuesta de la IA. Por favor, intenta de nuevo.');
        } else {
          setError(`Error al analizar la imagen: ${error.message}`);
        }
      } else {
        setError('Error inesperado al analizar la imagen. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMealPlan = async () => {
    setIsGeneratingPlan(true);
    setError('');

    try {
      // Convertir currentInventory al formato correcto
      const formattedCurrentInventory = (currentInventory as InventoryItem[]).map((item) => ({
        name: item.food?.name || item.name || 'Ingrediente',
        quantity: item.quantity || 1,
        unit: item.unit || 'PIECE',
        category: item.food?.category || item.category || 'OTHER'
      }));

      // Convertir missingIngredients al formato correcto
      const formattedMissingIngredients = missingIngredients.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category
      }));

      // Combinar inventario actual con ingredientes detectados
      const combinedInventory = [...formattedCurrentInventory, ...formattedMissingIngredients];
      
      console.log('Inventario combinado para plan de comidas:', combinedInventory);
      
      if (combinedInventory.length === 0) {
        setError('No hay ingredientes disponibles para generar un plan de comidas');
        return;
      }

      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventory: combinedInventory,
          days: planningDays,
          startDate: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', response.status, errorData);
        throw new Error(`Error al generar el plan de comidas: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Plan de comidas generado exitosamente:', data);
      onMealPlanGenerated(data.mealPlan);

    } catch (error) {
      console.error('Error:', error);
      
      // Mostrar mensaje específico para error de cuota
      if (error instanceof Error && error.message.includes('cuota')) {
        setError('Límite de cuota de API excedido. Por favor, intenta de nuevo mañana o considera actualizar tu plan de API.');
      } else {
        setError('Error al generar el plan de comidas. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const confirmIngredients = () => {
    addIngredientsToInventory();
  };

  const editIngredient = (index: number, field: string, value: unknown) => {
    const updated = [...missingIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setMissingIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = missingIngredients.filter((_, i) => i !== index);
    setMissingIngredients(updated);
  };

  const addNewIngredient = () => {
    if (newIngredient.name && newIngredient.quantity && newIngredient.unit && newIngredient.category) {
      const ingredient: DetectedIngredient = {
        name: newIngredient.name,
        quantity: newIngredient.quantity,
        unit: newIngredient.unit,
        category: newIngredient.category,
        confidence: 1.0
      };
      setMissingIngredients([...missingIngredients, ingredient]);
      setNewIngredient({});
    }
  };

  const startEditing = (index: number) => {
    setEditingIngredient(index);
  };

  const saveEdit = (index: number) => {
    setEditingIngredient(null);
  };

  const editDetectedIngredient = (index: number, field: string, value: unknown) => {
    const updated = [...detectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setDetectedIngredients(updated);
  };

  const removeDetectedIngredient = (index: number) => {
    const updated = detectedIngredients.filter((_, i) => i !== index);
    setDetectedIngredients(updated);
  };

  const addDetectedToMissing = (index: number) => {
    const ingredient = detectedIngredients[index];
    setMissingIngredients([...missingIngredients, ingredient]);
    removeDetectedIngredient(index);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🖼️ Análisis Inteligente de Ingredientes
        </h3>
        <p className="text-gray-600">
          Sube una foto de tus ingredientes y la IA los analizará automáticamente
        </p>
      </div>

      {!showIngredientReview ? (
        <div className="space-y-6">
          {/* Subida de imagen */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {selectedImage ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Imagen seleccionada"
                    className="mx-auto max-h-48 rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">{selectedImage.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="mx-auto h-16 w-16 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Haz clic para subir una foto
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, WebP hasta 5MB
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botón de análisis */}
          <motion.button
            onClick={analyzeImage}
            disabled={!selectedImage || isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analizando imagen con IA...</span>
                </div>
                <p className="text-xs text-blue-100">
                  Esto puede tardar 30-60 segundos dependiendo del tamaño de la imagen
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Analizar Ingredientes</span>
              </div>
            )}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ingredientes detectados */}
          <div className="bg-green-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-green-800 mb-4">
              ✅ Ingredientes Detectados (Editable)
            </h4>
            <div className="space-y-3">
              {detectedIngredients.map((ingredient, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => editDetectedIngredient(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editDetectedIngredient(index, 'quantity', Math.max(0, ingredient.quantity - 0.1))}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => editDetectedIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                          min="0"
                          step="0.1"
                        />
                        <button
                          onClick={() => editDetectedIngredient(index, 'quantity', ingredient.quantity + 0.1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <select
                        value={ingredient.unit}
                        onChange={(e) => editDetectedIngredient(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="PIECE">Pieza</option>
                        <option value="GRAM">Gramo</option>
                        <option value="KILOGRAM">Kilogramo</option>
                        <option value="LITER">Litro</option>
                        <option value="MILLILITER">Mililitro</option>
                        <option value="CUP">Taza</option>
                        <option value="TABLESPOON">Cucharada</option>
                        <option value="TEASPOON">Cucharadita</option>
                      </select>
                    </div>
                    <div className="flex items-end space-x-2">
                      <button
                        onClick={() => addDetectedToMissing(index)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => removeDetectedIngredient(index)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setMissingIngredients([...missingIngredients, ...detectedIngredients]);
                  setDetectedIngredients([]);
                }}
                disabled={detectedIngredients.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                Agregar Todos los Ingredientes Detectados
              </button>
            </div>
          </div>

          {/* Ingredientes faltantes */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-4">
              ➕ Ingredientes para Agregar al Inventario
            </h4>
            <div className="space-y-3">
              {missingIngredients.map((ingredient, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => editIngredient(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => editIngredient(index, 'quantity', Math.max(0, ingredient.quantity - 0.1))}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => editIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                          min="0"
                          step="0.1"
                        />
                        <button
                          onClick={() => editIngredient(index, 'quantity', ingredient.quantity + 0.1)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <select
                        value={ingredient.unit}
                        onChange={(e) => editIngredient(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="PIECE">Pieza</option>
                        <option value="GRAM">Gramo</option>
                        <option value="KILOGRAM">Kilogramo</option>
                        <option value="LITER">Litro</option>
                        <option value="MILLILITER">Mililitro</option>
                        <option value="CUP">Taza</option>
                        <option value="TABLESPOON">Cucharada</option>
                        <option value="TEASPOON">Cucharadita</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={ingredient.category}
                        onChange={(e) => editIngredient(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="VEGETABLE">Verdura</option>
                        <option value="FRUIT">Fruta</option>
                        <option value="MEAT">Carne</option>
                        <option value="DAIRY">Lácteo</option>
                        <option value="GRAIN">Cereal</option>
                        <option value="LIQUID">Líquido</option>
                        <option value="SPICE">Especia</option>
                        <option value="OTHER">Otro</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeIngredient(index)}
                        className="w-full bg-red-100 text-red-600 py-2 px-3 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agregar nuevo ingrediente */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              ➕ Agregar Ingrediente Manualmente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newIngredient.name || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  placeholder="Ej: Sal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={newIngredient.quantity || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, quantity: parseFloat(e.target.value)})}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  value={newIngredient.unit || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="PIECE">Pieza</option>
                  <option value="GRAM">Gramo</option>
                  <option value="KILOGRAM">Kilogramo</option>
                  <option value="LITER">Litro</option>
                  <option value="MILLILITER">Mililitro</option>
                  <option value="CUP">Taza</option>
                  <option value="TABLESPOON">Cucharada</option>
                  <option value="TEASPOON">Cucharadita</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newIngredient.category || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="VEGETABLE">Verdura</option>
                  <option value="FRUIT">Fruta</option>
                  <option value="MEAT">Carne</option>
                  <option value="DAIRY">Lácteo</option>
                  <option value="GRAIN">Cereal</option>
                  <option value="LIQUID">Líquido</option>
                  <option value="SPICE">Especia</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addNewIngredient}
                  disabled={!newIngredient.name || !newIngredient.quantity || !newIngredient.unit || !newIngredient.category}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Sugerencias */}
          {suggestions.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                💡 Sugerencias
              </h4>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-yellow-700 text-sm">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Configuración de planificación */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Planificación de Comidas
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días a planificar (máximo 7)
                </label>
                <input
                  type="number"
                  value={planningDays || 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setPlanningDays(Math.min(7, Math.max(1, value)));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  max="7"
                />
              </div>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          {ingredientsAdded && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="text-lg font-semibold text-green-800">
                    ✅ Ingredientes Agregados al Inventario
                  </h4>
                  <p className="text-green-700 text-sm">
                    Los ingredientes han sido agregados exitosamente. Ahora puedes generar un plan de comidas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-4">
            {!ingredientsAdded ? (
              <motion.button
                onClick={confirmIngredients}
                disabled={isAddingToInventory || missingIngredients.length === 0}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isAddingToInventory ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Agregando al inventario...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Confirmar Ingredientes</span>
                  </div>
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setShowIngredientReview(false)}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Cerrar</span>
                </div>
              </motion.button>
            )}

            <motion.button
              onClick={generateMealPlan}
              disabled={isGeneratingPlan}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGeneratingPlan ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generando plan...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Generar Plan de Comidas</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}