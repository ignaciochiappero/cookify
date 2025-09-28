'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Star, ChefHat, Shield, Heart, Zap } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import { UserPreferences } from '@/types/user-preferences';

interface RecipeCardProps {
  recipe: Recipe;
  showHealthConditions?: boolean;
  userPreferences?: UserPreferences | null;
  className?: string;
}

export default function RecipeCard({ 
  recipe, 
  showHealthConditions = true, 
  userPreferences,
  className = "" 
}: RecipeCardProps) {
  
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "fácil":
        return "text-green-600 bg-green-100";
      case "medio":
        return "text-yellow-600 bg-yellow-100";
      case "difícil":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "fácil":
        return "⭐";
      case "medio":
        return "⭐⭐";
      case "difícil":
        return "⭐⭐⭐";
      default:
        return "⭐";
    }
  };

  const getConditionIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('azúcar')) {
      return <Shield className="w-4 h-4" />;
    }
    if (lowerCondition.includes('presión') || lowerCondition.includes('hipertensión')) {
      return <Heart className="w-4 h-4" />;
    }
    if (lowerCondition.includes('colesterol')) {
      return <Zap className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const getConditionColor = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('azúcar')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (lowerCondition.includes('presión') || lowerCondition.includes('hipertensión')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (lowerCondition.includes('colesterol')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-green-50 text-green-700 border-green-200';
  };

  // Usar las patologías del usuario en lugar de las de la receta
  const allHealthConditions = userPreferences ? [
    ...(userPreferences.healthConditions || []),
    ...(userPreferences.customHealthConditions || [])
  ] : [
    ...(recipe.healthConditions || []),
    ...(recipe.customHealthConditions || [])
  ];
  
  console.log('🔍 DEBUG: RecipeCard recibió:', {
    recipe,
    userPreferences,
    healthConditions: recipe.healthConditions,
    customHealthConditions: recipe.customHealthConditions,
    userHealthConditions: userPreferences?.healthConditions,
    userCustomHealthConditions: userPreferences?.customHealthConditions,
    allHealthConditions,
    showHealthConditions
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-strong border border-primary-200 overflow-hidden ${className}`}
    >
      {/* Recipe Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">
              {recipe.title}
            </h3>
            <p className="text-primary-100 text-sm">
              {recipe.description}
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
            <span className="text-sm">
              {recipe.cookingTime} min
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {recipe.servings} porciones
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span className="text-sm">
              {getDifficultyIcon(recipe.difficulty)}
            </span>
          </div>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="p-6">
        {/* Health Conditions Section */}
        {showHealthConditions && allHealthConditions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Shield className="w-4 h-4 text-primary-600" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700">
                Pueden comer esta receta personas con:
              </h4>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allHealthConditions.map((condition, index) => (
                <div
                  key={index}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getConditionColor(condition)}`}
                >
                  {getConditionIcon(condition)}
                  <span>{condition}</span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg mt-3">
              💡 Esta receta ha sido adaptada considerando estas condiciones de salud para brindarte los mejores beneficios nutricionales.
            </p>
          </div>
        )}

        {/* Ingredients */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
            <ChefHat className="w-5 h-5 mr-2 text-primary-600" />
            Ingredientes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(() => {
              try {
                const ingredients = JSON.parse(recipe.ingredients);
                return ingredients.map((ingredient: { name: string }, idx: number) => (
                  <div
                    key={idx}
                    className="bg-primary-50 border border-primary-200 rounded-lg p-3"
                  >
                    <span className="text-primary-800 font-medium">{ingredient.name}</span>
                  </div>
                ));
              } catch (error) {
                console.error('Error parsing ingredients:', error);
                return (
                  <div className="text-gray-500 text-sm">
                    No se pudieron cargar los ingredientes
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Instrucciones
          </h4>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
              recipe.difficulty
            )}`}
          >
            {recipe.difficulty}
          </span>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
            {recipe.instructions}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
