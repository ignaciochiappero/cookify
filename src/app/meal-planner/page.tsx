'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Package, 
  ChefHat, 
  Sparkles
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import InventoryManager from '@/components/InventoryManager';
import MealCalendar from '@/components/MealCalendar';
import RecipeGenerator from '@/components/RecipeGenerator';
import { IngredientInventory, FoodCategory, FoodUnit } from '@/types/inventory';
import { Recipe } from '@/types/recipe';

interface Food {
  id: string;
  name: string;
  description: string;
  image: string;
  category: FoodCategory;
  unit: FoodUnit;
}

export default function MealPlanner() {
  useSession();
  const [activeTab, setActiveTab] = useState<'inventory' | 'calendar' | 'generator'>('inventory');
  const [foods, setFoods] = useState<Food[]>([]);
  const [inventory, setInventory] = useState<IngredientInventory[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [foodsResponse, inventoryResponse, recipesResponse] = await Promise.all([
        fetch('/api/food'),
        fetch('/api/inventory'),
        fetch('/api/recipes')
      ]);

      if (foodsResponse.ok) {
        const foodsData = await foodsResponse.json();
        setFoods(foodsData.data || []);
      }

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        if (inventoryData.success) {
          setInventory(inventoryData.data || []);
        } else {
          setInventory([]);
        }
      }

      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        setRecipes(recipesData.data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeGenerated = (newRecipe: Recipe) => {
    setRecipes(prev => [newRecipe, ...prev]);
  };

  const tabs = [
    {
      id: 'inventory' as const,
      label: 'Inventario',
      icon: Package,
      description: 'Gestiona tus ingredientes'
    },
    {
      id: 'calendar' as const,
      label: 'Calendario',
      icon: Calendar,
      description: 'Planifica tus comidas'
    },
    {
      id: 'generator' as const,
      label: 'Generador IA',
      icon: Sparkles,
      description: 'Crea recetas personalizadas'
    }
  ];

  const stats = [
    {
      label: 'Ingredientes',
      value: inventory.length,
      icon: Package,
      color: 'text-primary-600 bg-primary-100'
    },
    {
      label: 'Recetas',
      value: recipes.length,
      icon: ChefHat,
      color: 'text-accent-600 bg-accent-100'
    },
    {
      label: 'Comidas Planificadas',
      value: 0, // TODO: Calculate from calendar
      icon: Calendar,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Generadas con IA',
      value: recipes.length,
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
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
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-strong"
              >
                <ChefHat className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Planificador de Comidas
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Gestiona tu inventario, planifica tus comidas y genera recetas personalizadas con IA
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-soft border border-primary-200 mb-8"
          >
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'inventory' && (
                  <InventoryManager foods={foods} />
                )}
                {activeTab === 'calendar' && (
                  <MealCalendar recipes={recipes} />
                )}
                {activeTab === 'generator' && (
                  <RecipeGenerator 
                    inventory={inventory} 
                    onRecipeGenerated={handleRecipeGenerated}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
