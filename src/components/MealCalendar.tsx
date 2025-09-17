'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Coffee,
  Utensils,
  Apple,
  Moon,
  Clock,
  ChefHat,
  Sparkles,
  Trash2,
  Edit,
  RotateCcw,
  Eye
} from 'lucide-react';
import { 
  MealCalendarItem, 
  CreateMealCalendarItem, 
  MealType, 
  MEAL_TYPE_LABELS
} from '@/types/meal-calendar';
import { Recipe } from '@/types/recipe';

// Iconos de Lucide para tipos de comida
const MEAL_TYPE_LUCIDE_ICONS: Record<MealType, React.ComponentType<{ className?: string }>> = {
  [MealType.BREAKFAST]: Coffee,
  [MealType.LUNCH]: Utensils,
  [MealType.SNACK]: Apple,
  [MealType.DINNER]: Moon,
};

interface MealCalendarProps {
  recipes: Recipe[];
}

export default function MealCalendar({ recipes }: MealCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState<MealCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealCalendarItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Estados para el planificador inteligente
  const [isSmartPlannerOpen, setIsSmartPlannerOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Array<{date: Date, mealType: MealType}>>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  
  // Estados para el modal de detalles de receta
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [selectedRecipeMeal, setSelectedRecipeMeal] = useState<MealCalendarItem | null>(null);
  const [isRegeneratingRecipe, setIsRegeneratingRecipe] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [formData, setFormData] = useState<CreateMealCalendarItem>({
    date: new Date(),
    mealType: MealType.BREAKFAST,
    recipeId: '',
    customMealName: '',
    notes: ''
  });

  const fetchMeals = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/meal-calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMeals(data);
      }
    } catch (error) {
      console.error('Error al cargar comidas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // Cargar comidas del mes actual
  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingMeal ? `/api/meal-calendar/${editingMeal.id}` : '/api/meal-calendar';
      const method = editingMeal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchMeals();
        resetForm();
      }
    } catch (error) {
      console.error('Error al guardar comida:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleEdit = (meal: MealCalendarItem) => {
    setEditingMeal(meal);
    setFormData({
      date: new Date(meal.date),
      mealType: meal.mealType,
      recipeId: meal.recipeId || '',
      customMealName: meal.customMealName || '',
      notes: meal.notes || ''
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      date: selectedDate,
      mealType: selectedMealType || MealType.BREAKFAST,
      recipeId: '',
      customMealName: '',
      notes: ''
    });
    setEditingMeal(null);
    setIsFormOpen(false);
    setSelectedMealType(null);
  };

  // Funciones para el planificador inteligente
  const toggleSlotSelection = (date: Date, mealType: MealType) => {
    const existingIndex = selectedSlots.findIndex(
      slot => slot.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] && 
              slot.mealType === mealType
    );

    if (existingIndex >= 0) {
      // Remover slot si ya está seleccionado
      setSelectedSlots(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Agregar slot si no está seleccionado
      setSelectedSlots(prev => [...prev, { date, mealType }]);
    }
  };

  const isSlotSelected = (date: Date, mealType: MealType) => {
    return selectedSlots.some(
      slot => slot.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] && 
              slot.mealType === mealType
    );
  };

  const clearSelectedSlots = () => {
    setSelectedSlots([]);
  };

  const generateBulkRecipes = async () => {
    if (selectedSlots.length === 0) return;

    setIsGeneratingRecipes(true);
    try {
      console.log('Iniciando generación masiva para slots:', selectedSlots);
      
      // Agrupar slots por tipo de comida para generar recetas más eficientemente
      const slotsByMealType = selectedSlots.reduce((acc, slot) => {
        if (!acc[slot.mealType]) {
          acc[slot.mealType] = [];
        }
        acc[slot.mealType].push(slot);
        return acc;
      }, {} as Record<MealType, Array<{date: Date, mealType: MealType}>>);

      console.log('Slots agrupados por tipo de comida:', slotsByMealType);

      // Generar recetas para cada tipo de comida
      for (const [mealType, slots] of Object.entries(slotsByMealType)) {
        try {
          console.log(`Generando receta para ${mealType} con ${slots.length} slots`);
          
          const response = await fetch('/api/recipes/generate-from-inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mealType: mealType as MealType,
              servings: 4,
              suggestIngredients: true
            }),
          });

          console.log(`Respuesta para ${mealType}:`, response.status, response.ok);

          if (response.ok) {
            const responseData = await response.json();
            console.log(`Datos de respuesta para ${mealType}:`, responseData);
            
            const recipe = responseData.recipe;
            if (!recipe || !recipe.id) {
              console.error(`No se pudo obtener la receta para ${mealType}:`, responseData);
              continue;
            }
            
            // Crear o actualizar entradas en el calendario para cada slot de este tipo de comida
            for (const slot of slots) {
              console.log(`Procesando entrada en calendario para ${slot.date} - ${slot.mealType}`);
              
              // Primero intentar crear una nueva entrada
              const calendarResponse = await fetch('/api/meal-calendar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  date: slot.date.toISOString(),
                  mealType: slot.mealType,
                  recipeId: recipe.id,
                  notes: `Generado automáticamente por el Planificador Inteligente`
                }),
              });

              if (calendarResponse.ok) {
                console.log(`Entrada creada exitosamente para ${slot.date} - ${slot.mealType}`);
              } else {
                // Si falla porque ya existe, buscar la entrada existente y actualizarla
                await calendarResponse.text();
                console.log(`Entrada ya existe para ${slot.date} - ${slot.mealType}, actualizando...`);
                
                // Buscar la entrada existente en el array de meals
                const existingMeal = meals.find(meal => {
                  const mealDate = new Date(meal.date);
                  return mealDate.toISOString().split('T')[0] === slot.date.toISOString().split('T')[0] && 
                         meal.mealType === slot.mealType;
                });

                if (existingMeal) {
                  // Actualizar la entrada existente
                  const updateResponse = await fetch(`/api/meal-calendar/${existingMeal.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      recipeId: recipe.id,
                      notes: `Actualizado automáticamente por el Planificador Inteligente`
                    }),
                  });

                  if (updateResponse.ok) {
                    console.log(`Entrada actualizada exitosamente para ${slot.date} - ${slot.mealType}`);
                  } else {
                    console.error(`Error actualizando entrada para ${slot.date} - ${slot.mealType}:`, await updateResponse.text());
                  }
                } else {
                  console.error(`No se encontró entrada existente para actualizar ${slot.date} - ${slot.mealType}`);
                }
              }
            }
          } else {
            const errorText = await response.text();
            console.error(`Error en API de generación para ${mealType}:`, errorText);
          }
        } catch (error) {
          console.error(`Error generando recetas para ${mealType}:`, error);
        }
      }

      // Recargar las comidas y limpiar selección
      console.log('Recargando comidas...');
      await fetchMeals();
      clearSelectedSlots();
      setIsSmartPlannerOpen(false);
      
    } catch (error) {
      console.error('Error en generación masiva:', error);
    } finally {
      setIsGeneratingRecipes(false);
    }
  };

  // Funciones para el modal de detalles de receta
  const openRecipeDetail = (meal: MealCalendarItem) => {
    setSelectedRecipeMeal(meal);
    setIsRecipeDetailOpen(true);
  };

  const closeRecipeDetail = () => {
    setSelectedRecipeMeal(null);
    setIsRecipeDetailOpen(false);
  };

  const handleEditRecipe = (meal: MealCalendarItem) => {
    closeRecipeDetail();
    handleEdit(meal);
  };

  const handleDeleteRecipe = async (meal: MealCalendarItem) => {
    try {
      const response = await fetch(`/api/meal-calendar/${meal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMeals();
        closeRecipeDetail();
      }
    } catch (error) {
      console.error('Error eliminando receta:', error);
    }
  };

  const handleRegenerateRecipe = async (meal: MealCalendarItem) => {
    if (!meal.recipeId) return;

    setIsRegeneratingRecipe(true);
    try {
      // Generar nueva receta con IA
      const response = await fetch('/api/recipes/generate-from-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealType: meal.mealType,
          servings: 4,
          suggestIngredients: true
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newRecipe = responseData.recipe;
        
        // Actualizar la entrada del calendario con la nueva receta
        await fetch(`/api/meal-calendar/${meal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeId: newRecipe.id,
            notes: `Regenerado automáticamente con IA - ${new Date().toLocaleDateString()}`
          }),
        });

        await fetchMeals();
        closeRecipeDetail();
      }
    } catch (error) {
      console.error('Error regenerando receta:', error);
    } finally {
      setIsRegeneratingRecipe(false);
    }
  };

  const openFormForMeal = (date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setFormData({
      date,
      mealType,
      recipeId: '',
      customMealName: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const getMealForDate = (date: Date, mealType: MealType) => {
    const dateStr = date.toISOString().split('T')[0];
    return meals.find(meal => {
      const mealDate = new Date(meal.date);
      return mealDate.toISOString().split('T')[0] === dateStr && 
             meal.mealType === mealType;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const mealTypes = Object.values(MealType);

  if (isLoading && meals.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Calendario de Comidas
            </h2>
            <p className="text-gray-600">
              Planifica tus comidas diarias y organiza tu menú semanal
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isSmartPlannerOpen) {
                // Si ya está en modo selección, generar recetas
                generateBulkRecipes();
              } else {
                // Activar modo de selección
                setIsSmartPlannerOpen(true);
              }
            }}
            disabled={isGeneratingRecipes}
            className={`flex items-center space-x-2 font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium ${
              isSmartPlannerOpen
                ? selectedSlots.length > 0
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
            }`}
          >
            {isGeneratingRecipes ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>Generando...</span>
              </>
            ) : isSmartPlannerOpen ? (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generar Recetas ({selectedSlots.length})</span>
              </>
            ) : (
              <>
                <ChefHat className="w-5 h-5" />
                <span>Planificador Inteligente</span>
              </>
            )}
          </motion.button>
          
          {isSmartPlannerOpen && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsSmartPlannerOpen(false);
                clearSelectedSlots();
              }}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFormOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Comida</span>
          </motion.button>
        </div>
      </div>

      {/* Smart Planner Mode Indicator */}
      {isSmartPlannerOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-200 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">
                  Modo Planificador Inteligente
                </h4>
                <p className="text-sm text-purple-700">
                  Haz clic en los slots de comida para seleccionarlos. 
                  {selectedSlots.length > 0 && ` ${selectedSlots.length} slots seleccionados.`}
                </p>
              </div>
            </div>
            {selectedSlots.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-purple-800">
                  {selectedSlots.length} seleccionados
                </span>
                <button
                  onClick={clearSelectedSlots}
                  className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Calendar Navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              Hoy
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {getDaysInMonth(currentDate).map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`min-h-[120px] p-3 border border-gray-100 rounded-lg ${
                day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
              } ${isToday(day.date) ? 'ring-2 ring-primary-500 bg-primary-50' : ''} transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday(day.date) ? 'text-primary-600' : ''}`}>
                  {day.date.getDate()}
                </span>
                {day.isCurrentMonth && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openFormForMeal(day.date, MealType.BREAKFAST)}
                    className="w-6 h-6 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all duration-200 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
              
              {/* Meal Types */}
              <div className="space-y-1">
                {mealTypes.map((mealType) => {
                  const meal = getMealForDate(day.date, mealType);
                  return (
                    <motion.div
                      key={mealType}
                      whileHover={{ scale: 1.02 }}
                      className={`text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSmartPlannerOpen && isSlotSelected(day.date, mealType)
                          ? 'bg-purple-200 text-purple-800 border-2 border-purple-400 ring-2 ring-purple-200'
                          : meal 
                            ? meal.isCompleted 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-primary-100 text-primary-800 border border-primary-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200'
                      }`}
                      onClick={() => {
                        if (isSmartPlannerOpen) {
                          // Modo planificador inteligente: seleccionar/deseleccionar slots
                          if (day.isCurrentMonth) {
                            toggleSlotSelection(day.date, mealType);
                          }
                        } else {
                          // Modo normal: mostrar detalles de receta o agregar comida
                          if (meal) {
                            openRecipeDetail(meal);
                          } else if (day.isCurrentMonth) {
                            openFormForMeal(day.date, mealType);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const IconComponent = MEAL_TYPE_LUCIDE_ICONS[mealType];
                          return <IconComponent className="w-4 h-4 text-primary-600 flex-shrink-0" />;
                        })()}
                        <span className="truncate text-sm font-medium">
                          {meal ? (meal.recipe?.title || meal.customMealName || MEAL_TYPE_LABELS[mealType]) : MEAL_TYPE_LABELS[mealType]}
                        </span>
                        {meal?.isCompleted && <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <ChefHat className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingMeal ? 'Editar Comida' : 'Agregar Comida'}
                  </h3>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-primary-600" />
                    <span>Fecha *</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-primary-600" />
                    <span>Tipo de Comida *</span>
                  </label>
                  <select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MealType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {mealTypes.map((mealType) => (
                      <option key={mealType} value={mealType}>
                        {MEAL_TYPE_LABELS[mealType]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <ChefHat className="w-4 h-4 text-primary-600" />
                    <span>Receta</span>
                  </label>
                  <select
                    value={formData.recipeId}
                    onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona una receta</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <ChefHat className="w-4 h-4 text-primary-600" />
                    <span>Nombre Personalizado</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customMealName}
                    onChange={(e) => setFormData({ ...formData, customMealName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: Pizza casera, Ensalada especial..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span>Notas</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Notas adicionales sobre esta comida..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:text-primary-100 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{editingMeal ? 'Actualizar' : 'Agregar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {isRecipeDetailOpen && selectedRecipeMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeRecipeDetail}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Eye className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedRecipeMeal.recipe?.title || selectedRecipeMeal.customMealName || 'Comida Programada'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedRecipeMeal.date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })} - {MEAL_TYPE_LABELS[selectedRecipeMeal.mealType]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRecipeDetail}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recipe Details */}
              {selectedRecipeMeal.recipe && (
                <div className="space-y-6">
                  {/* Recipe Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Información de la Receta</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {selectedRecipeMeal.recipe.cookingTime} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ChefHat className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {selectedRecipeMeal.recipe.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Utensils className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {selectedRecipeMeal.recipe.servings} porciones
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${selectedRecipeMeal.isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${selectedRecipeMeal.isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                          {selectedRecipeMeal.isCompleted ? 'Completada' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedRecipeMeal.recipe.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {selectedRecipeMeal.recipe.description}
                      </p>
                    </div>
                  )}

                  {/* Ingredients */}
                  {selectedRecipeMeal.recipe.ingredients && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Ingredientes</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const ingredients = JSON.parse(selectedRecipeMeal.recipe.ingredients);
                            return ingredients.map((ingredient: { name: string }, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full border border-primary-200"
                              >
                                {ingredient.name}
                              </span>
                            ));
                          } catch {
                            return (
                              <span className="text-gray-600 text-sm">
                                {selectedRecipeMeal.recipe.ingredients}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {selectedRecipeMeal.recipe.instructions && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Instrucciones</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                          {selectedRecipeMeal.recipe.instructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedRecipeMeal.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                      <p className="text-gray-700 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        {selectedRecipeMeal.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Meal */}
              {!selectedRecipeMeal.recipe && selectedRecipeMeal.customMealName && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Comida Personalizada</h4>
                    <p className="text-gray-700">{selectedRecipeMeal.customMealName}</p>
                  </div>
                  {selectedRecipeMeal.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Notas</h4>
                      <p className="text-gray-700 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        {selectedRecipeMeal.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleEditRecipe(selectedRecipeMeal)}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                
                {selectedRecipeMeal.recipe && (
                  <button
                    onClick={() => handleRegenerateRecipe(selectedRecipeMeal)}
                    disabled={isRegeneratingRecipe}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:text-purple-100 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                  >
                    {isRegeneratingRecipe ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Regenerando...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Regenerar con IA</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteRecipe(selectedRecipeMeal)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
