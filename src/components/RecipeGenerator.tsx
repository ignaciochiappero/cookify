'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ChefHat, 
  Clock, 
  Users, 
  Star,
  Plus,
  AlertCircle
} from 'lucide-react';
import { MealType, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from '@/types/meal-calendar';
import { IngredientInventory } from '@/types/inventory';
import { Recipe } from '@/types/recipe';


interface RecipeGeneratorProps {
  inventory: IngredientInventory[];
  onRecipeGenerated: (recipe: Recipe) => void;
}

export default function RecipeGenerator({ inventory, onRecipeGenerated }: RecipeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    mealType: MealType.LUNCH,
    servings: 4,
    suggestIngredients: false
  });
  const [error, setError] = useState('');

  // Asegurar que inventory sea siempre un array
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedRecipe(null);
    setSuggestedIngredients([]);

    try {
      const response = await fetch('/api/recipes/generate-from-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedRecipe(data.recipe);
        setSuggestedIngredients(data.suggestedIngredients || []);
        onRecipeGenerated(data.recipe);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al generar la receta');
      }
    } catch (error) {
      console.error('Error al generar receta:', error);
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil': return 'text-green-600 bg-green-100';
      case 'medio': return 'text-yellow-600 bg-yellow-100';
      case 'difícil': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil': return '⭐';
      case 'medio': return '⭐⭐';
      case 'difícil': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-soft border border-primary-200 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Inventario Vacío
        </h3>
        <p className="text-gray-600">
          Agrega ingredientes a tu inventario para poder generar recetas personalizadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Generador de Recetas con IA
        </h2>
        <p className="text-gray-600">
          Crea recetas personalizadas basadas en los ingredientes de tu inventario
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Comida
              </label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MealType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Object.values(MealType).map((mealType) => (
                  <option key={mealType} value={mealType}>
                    {MEAL_TYPE_ICONS[mealType]} {MEAL_TYPE_LABELS[mealType]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porciones
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.suggestIngredients}
                  onChange={(e) => setFormData({ ...formData, suggestIngredients: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Sugerir ingredientes</span>
              </label>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-medium hover:shadow-strong disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Generando receta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generar Receta con IA</span>
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Generated Recipe */}
      {generatedRecipe && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-strong border border-primary-200 overflow-hidden"
        >
          {/* Recipe Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">
                  {generatedRecipe.title}
                </h3>
                <p className="text-primary-100 text-sm">
                  {generatedRecipe.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍽️</span>
              </div>
            </div>

            {/* Recipe Meta */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{generatedRecipe.cookingTime} min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">{generatedRecipe.servings} porciones</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span className="text-sm">{getDifficultyIcon(generatedRecipe.difficulty)}</span>
              </div>
            </div>
          </div>

          {/* Recipe Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Instrucciones</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(generatedRecipe.difficulty)}`}>
                {generatedRecipe.difficulty}
              </span>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                {generatedRecipe.instructions}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggested Ingredients */}
      {suggestedIngredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary-600" />
            Ingredientes Sugeridos
          </h4>
          <p className="text-gray-600 mb-4">
            Estos ingredientes podrían mejorar tu receta o crear más variedad:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedIngredients.map((ingredient, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-800 border border-accent-200"
              >
                {ingredient}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Inventory Summary */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Ingredientes Disponibles ({safeInventory.length})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {safeInventory.slice(0, 8).map((item) => (
            <div key={item.id} className="text-sm text-gray-600 bg-white rounded-lg p-2">
              {item.food.name}
            </div>
          ))}
          {safeInventory.length > 8 && (
            <div className="text-sm text-gray-500 bg-white rounded-lg p-2 flex items-center justify-center">
              +{safeInventory.length - 8} más
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
