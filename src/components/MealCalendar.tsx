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
  ChefHat
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
                        meal 
                          ? meal.isCompleted 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-primary-100 text-primary-800 border border-primary-200'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200'
                      }`}
                      onClick={() => {
                        if (meal) {
                          handleEdit(meal);
                        } else if (day.isCurrentMonth) {
                          openFormForMeal(day.date, mealType);
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
    </div>
  );
}
