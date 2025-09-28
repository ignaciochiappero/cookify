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
  BookOpen,
  Trash2,
  Edit,
  Check,
  FileText,
} from 'lucide-react';
import Confetti from 'react-confetti';
import { Food } from '@/types/food';
import { RecipeIngredient } from '@/types/recipe';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import RecipeCard from '@/components/RecipeCard';
import UserPreferencesDebug from '@/components/UserPreferencesDebug';
import { UserPreferences } from '@/types/user-preferences';
import { renderIcon } from '@/lib/iconUtils';



export default function Dashboard() {
  const { data: session } = useSession();
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
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
    healthConditions?: string[];
    customHealthConditions?: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'ChefHat',
    category: 'VEGETABLE' as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER',
    unit: 'PIECE' as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'ChefHat',
    category: 'VEGETABLE' as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER',
    unit: 'PIECE' as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE'
  });
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [createRecipeFormData, setCreateRecipeFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    cookingTime: 30,
    difficulty: 'Fácil' as 'Fácil' | 'Intermedio' | 'Difícil',
    servings: 4,
    ingredients: [] as Array<{ foodId: string; quantity: number; unit: string; name: string }>
  });

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

  // Opciones de categorías
  const categories = [
    { value: 'VEGETABLE', label: 'Vegetal' },
    { value: 'FRUIT', label: 'Fruta' },
    { value: 'MEAT', label: 'Carne' },
    { value: 'DAIRY', label: 'Lácteo' },
    { value: 'GRAIN', label: 'Grano' },
    { value: 'LIQUID', label: 'Líquido' },
    { value: 'SPICE', label: 'Especia' },
    { value: 'OTHER', label: 'Otro' }
  ];

  // Opciones de unidades
  const units = [
    { value: 'PIECE', label: 'Piezas' },
    { value: 'GRAM', label: 'Gramos' },
    { value: 'KILOGRAM', label: 'Kilogramos' },
    { value: 'LITER', label: 'Litros' },
    { value: 'MILLILITER', label: 'Mililitros' },
    { value: 'CUP', label: 'Tazas' },
    { value: 'TABLESPOON', label: 'Cucharadas' },
    { value: 'TEASPOON', label: 'Cucharaditas' },
    { value: 'POUND', label: 'Libras' },
    { value: 'OUNCE', label: 'Onzas' }
  ];

  // Opciones de dificultad
  const difficulties = [
    { value: 'Fácil', label: 'Fácil' },
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Difícil', label: 'Difícil' }
  ];

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  // Cargar preferencias del usuario
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        console.log('🔍 DEBUG: Dashboard - Cargando preferencias del usuario...');
        const response = await fetch('/api/user/preferences');
        console.log('🔍 DEBUG: Dashboard - Respuesta de preferencias:', response.status);
        
        if (response.ok) {
          const preferences = await response.json();
          console.log('🔍 DEBUG: Dashboard - Preferencias cargadas:', preferences);
          setUserPreferences(preferences);
        } else {
          console.log('🔍 DEBUG: Dashboard - Error cargando preferencias:', response.status);
        }
      } catch (error) {
        console.error('Error cargando preferencias del usuario:', error);
      }
    };

    if (session) {
      fetchUserPreferences();
    }
  }, [session]);

  // DEBUG: Monitorear cambios en los estados del modal
  useEffect(() => {
    console.log('🔍 DEBUG: Dashboard - Estados del modal cambiaron:');
    console.log('🔍 DEBUG: Dashboard - showRecipeModal:', showRecipeModal);
    console.log('🔍 DEBUG: Dashboard - generatedRecipe:', generatedRecipe);
    console.log('🔍 DEBUG: Dashboard - Condición del modal:', showRecipeModal && generatedRecipe);
  }, [showRecipeModal, generatedRecipe]);

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
      
      const response = await fetch('/api/recipes/generate-from-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          mealType: 'LUNCH', // Agregar mealType por defecto
          servings: 4,
          suggestIngredients: false
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('🔍 DEBUG: Dashboard - Receta generada exitosamente:', result);
        console.log('🔍 DEBUG: Dashboard - result.data:', result.data);
        console.log('🔍 DEBUG: Dashboard - result.data.recipe:', result.data?.recipe);
        console.log('🔍 DEBUG: Dashboard - result keys:', Object.keys(result));
        console.log('🔍 DEBUG: Dashboard - result.data keys:', result.data ? Object.keys(result.data) : 'null');
        
        // Mostrar confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        // Mostrar modal con la receta - SOLUCIÓN CRÍTICA
        console.log('🔍 DEBUG: Dashboard - Estableciendo generatedRecipe...');
        
        // DEBUGGING: Verificar todas las posibles estructuras
        let recipeData = null;
        
        if (result.data?.recipe) {
          recipeData = result.data.recipe;
          console.log('🔍 DEBUG: Dashboard - Usando result.data.recipe');
        } else if (result.data) {
          recipeData = result.data;
          console.log('🔍 DEBUG: Dashboard - Usando result.data');
        } else if (result.recipe) {
          recipeData = result.recipe;
          console.log('🔍 DEBUG: Dashboard - Usando result.recipe');
        } else {
          console.log('🔍 DEBUG: Dashboard - Estructura no reconocida, usando result completo');
          recipeData = result;
        }
        
        console.log('🔍 DEBUG: Dashboard - recipeData final:', recipeData);
        console.log('🔍 DEBUG: Dashboard - recipeData type:', typeof recipeData);
        console.log('🔍 DEBUG: Dashboard - recipeData keys:', recipeData ? Object.keys(recipeData) : 'null');
        
        // VERIFICAR QUE recipeData NO SEA NULL
        if (!recipeData) {
          console.error('🔍 DEBUG: Dashboard - ERROR: recipeData es null/undefined');
          console.error('🔍 DEBUG: Dashboard - result completo:', JSON.stringify(result, null, 2));
          alert('Error: No se pudo obtener la receta generada');
          return;
        }
        
        // ESTABLECER AMBOS ESTADOS AL MISMO TIEMPO
        console.log('🔍 DEBUG: Dashboard - Llamando setGeneratedRecipe con:', recipeData);
        setGeneratedRecipe(recipeData);
        console.log('🔍 DEBUG: Dashboard - Llamando setShowRecipeModal con true');
        setShowRecipeModal(true);
        
        console.log('🔍 DEBUG: Dashboard - Modal configurado para mostrarse');
        console.log('🔍 DEBUG: Dashboard - showRecipeModal:', true);
        console.log('🔍 DEBUG: Dashboard - generatedRecipe:', recipeData);
        
        // VERIFICAR ESTADOS DESPUÉS DE UN MOMENTO
        setTimeout(() => {
          console.log('🔍 DEBUG: Dashboard - Verificación después de 100ms:');
          console.log('🔍 DEBUG: Dashboard - showRecipeModal actual:', showRecipeModal);
          console.log('🔍 DEBUG: Dashboard - generatedRecipe actual:', generatedRecipe);
        }, 100);
      } else {
        console.log('🔍 DEBUG: Dashboard - Error en la respuesta:', result.error);
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

  const handleDeleteIngredient = async (foodId: string) => {
    try {
      setIsDeleting(foodId);
      
      const response = await fetch(`/api/food/${foodId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remover el ingrediente de la lista local
        setAllFoods(prev => prev.filter(food => food.id !== foodId));
        
        // Limpiar selecciones y cantidades si estaba seleccionado
        setLocalSelections(prev => {
          const newSelections = { ...prev };
          delete newSelections[foodId];
          return newSelections;
        });
        
        setIngredientQuantities(prev => {
          const newQuantities = { ...prev };
          delete newQuantities[foodId];
          return newQuantities;
        });
        
        setShowDeleteModal(null);
        alert('Ingrediente eliminado exitosamente');
      } else {
        alert(result.error || 'Error al eliminar el ingrediente');
      }
    } catch (error) {
      console.error('Error eliminando ingrediente:', error);
      alert('Error de conexión al eliminar ingrediente');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditIngredient = (food: Food) => {
    setEditingFood(food);
    setEditFormData({
      name: food.name,
      description: food.description,
      image: food.image,
      icon: food.icon || 'ChefHat',
      category: food.category,
      unit: food.unit
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.name.trim() || !editFormData.description.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!editingFood) return;

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/food/${editingFood.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar el ingrediente en la lista local
        setAllFoods(prev => prev.map(food => 
          food.id === editingFood.id 
            ? { ...food, ...editFormData }
            : food
        ));
        
        setShowEditModal(false);
        setEditingFood(null);
        alert('Ingrediente actualizado exitosamente');
      } else {
        alert(result.error || 'Error al actualizar el ingrediente');
      }
    } catch (error) {
      console.error('Error actualizando ingrediente:', error);
      alert('Error de conexión al actualizar ingrediente');
    } finally {
      setIsSaving(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingFood(null);
    setEditFormData({
      name: '',
      description: '',
      image: '',
      icon: 'ChefHat',
      category: 'VEGETABLE',
      unit: 'PIECE'
    });
  };

  const handleCreateIngredient = () => {
    setCreateFormData({
      name: '',
      description: '',
      image: '',
      icon: 'ChefHat',
      category: 'VEGETABLE',
      unit: 'PIECE'
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.name.trim() || !createFormData.description.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch('/api/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (result.success) {
        // Agregar el nuevo ingrediente a la lista local
        setAllFoods(prev => [...prev, result.data]);
        
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          description: '',
          image: '',
          icon: 'ChefHat',
          category: 'VEGETABLE',
          unit: 'PIECE'
        });
        alert('Ingrediente creado exitosamente');
      } else {
        alert(result.error || 'Error al crear el ingrediente');
      }
    } catch (error) {
      console.error('Error creando ingrediente:', error);
      alert('Error de conexión al crear ingrediente');
    } finally {
      setIsCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      name: '',
      description: '',
      image: '',
      icon: 'ChefHat',
      category: 'VEGETABLE',
      unit: 'PIECE'
    });
  };

  const handleCreateRecipe = () => {
    setCreateRecipeFormData({
      title: '',
      description: '',
      instructions: '',
      cookingTime: 30,
      difficulty: 'Fácil',
      servings: 4,
      ingredients: []
    });
    setShowCreateRecipeModal(true);
  };

  const handleSaveCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createRecipeFormData.title.trim() || !createRecipeFormData.description.trim() || !createRecipeFormData.instructions.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (createRecipeFormData.ingredients.length === 0) {
      alert('Por favor agrega al menos un ingrediente');
      return;
    }

    try {
      setIsCreatingRecipe(true);
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createRecipeFormData.title,
          description: createRecipeFormData.description,
          instructions: createRecipeFormData.instructions,
          cookingTime: createRecipeFormData.cookingTime,
          difficulty: createRecipeFormData.difficulty,
          servings: createRecipeFormData.servings,
          ingredients: createRecipeFormData.ingredients
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateRecipeModal(false);
        setCreateRecipeFormData({
          title: '',
          description: '',
          instructions: '',
          cookingTime: 30,
          difficulty: 'Fácil',
          servings: 4,
          ingredients: []
        });
        alert('Receta creada exitosamente');
      } else {
        alert(result.error || 'Error al crear la receta');
      }
    } catch (error) {
      console.error('Error creando receta:', error);
      alert('Error de conexión al crear receta');
    } finally {
      setIsCreatingRecipe(false);
    }
  };

  const closeCreateRecipeModal = () => {
    setShowCreateRecipeModal(false);
    setCreateRecipeFormData({
      title: '',
      description: '',
      instructions: '',
      cookingTime: 30,
      difficulty: 'Fácil',
      servings: 4,
      ingredients: []
    });
  };

  const addIngredientToRecipe = (food: Food) => {
    const existingIngredient = createRecipeFormData.ingredients.find(ing => ing.foodId === food.id);
    if (existingIngredient) {
      alert('Este ingrediente ya está agregado a la receta');
      return;
    }

    setCreateRecipeFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        foodId: food.id,
        quantity: 1,
        unit: food.unit,
        name: food.name
      }]
    }));
  };

  const removeIngredientFromRecipe = (foodId: string) => {
    setCreateRecipeFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.foodId !== foodId)
    }));
  };

  const updateIngredientQuantity = (foodId: string, quantity: number) => {
    setCreateRecipeFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing => 
        ing.foodId === foodId ? { ...ing, quantity } : ing
      )
    }));
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

          {/* Debug Component */}
          <UserPreferencesDebug />

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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateIngredient}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Ingrediente</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateRecipe}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Crear Receta</span>
                </motion.button>

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
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-center space-x-2">
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

                        {/* Edit Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditIngredient(food);
                          }}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Editar ingrediente"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>

                        {/* Delete Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(food.id);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
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
      {(() => {
        console.log('🔍 DEBUG: Modal renderizado - showRecipeModal:', showRecipeModal);
        console.log('🔍 DEBUG: Modal renderizado - generatedRecipe:', !!generatedRecipe);
        console.log('🔍 DEBUG: Modal renderizado - Condición:', showRecipeModal && generatedRecipe);
        return null;
      })()}
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
              {(() => {
                console.log('🔍 DEBUG: Dashboard - Pasando al RecipeCard:', {
                  userPreferences,
                  hasUserPreferences: !!userPreferences,
                  healthConditions: userPreferences?.healthConditions,
                  customHealthConditions: userPreferences?.customHealthConditions
                });
                return null;
              })()}
              <RecipeCard 
                recipe={generatedRecipe}
                showHealthConditions={true}
                userPreferences={userPreferences}
              />

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Recipe Modal */}
      <AnimatePresence>
        {showCreateRecipeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeCreateRecipeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-strong"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nueva Receta Personalizada
                </h3>
                <button
                  onClick={closeCreateRecipeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCreateRecipe} className="space-y-6">
                {/* Información básica de la receta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título de la Receta *
                    </label>
                    <input
                      type="text"
                      value={createRecipeFormData.title}
                      onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ej: Pasta Carbonara"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dificultad
                    </label>
                    <select
                      value={createRecipeFormData.difficulty}
                      onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, difficulty: e.target.value as 'Fácil' | 'Intermedio' | 'Difícil' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      {difficulties.map((difficulty) => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={createRecipeFormData.description}
                    onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Describe brevemente la receta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Cocción (min)
                    </label>
                    <input
                      type="number"
                      value={createRecipeFormData.cookingTime}
                      onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, cookingTime: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      min="1"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Porciones
                    </label>
                    <input
                      type="number"
                      value={createRecipeFormData.servings}
                      onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, servings: parseInt(e.target.value) || 4 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                {/* Sección de ingredientes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Ingredientes ({createRecipeFormData.ingredients.length})
                    </h4>
                    <span className="text-sm text-gray-500">
                      Haz clic en un ingrediente para agregarlo
                    </span>
                  </div>

                  {/* Lista de ingredientes agregados */}
                  {createRecipeFormData.ingredients.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Ingredientes seleccionados:</h5>
                      <div className="space-y-2">
                        {createRecipeFormData.ingredients.map((ingredient) => (
                          <div key={ingredient.foodId} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                {renderIcon(allFoods.find(f => f.id === ingredient.foodId)?.icon || 'ChefHat', "w-4 h-4 text-primary-600")}
                              </div>
                              <span className="font-medium text-gray-900">{ingredient.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={ingredient.quantity}
                                onChange={(e) => updateIngredientQuantity(ingredient.foodId, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                                min="1"
                              />
                              <span className="text-sm text-gray-500">{unitLabels[ingredient.unit as keyof typeof unitLabels]}</span>
                              <button
                                type="button"
                                onClick={() => removeIngredientFromRecipe(ingredient.foodId)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grid de ingredientes disponibles */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                    {allFoods.map((food) => {
                      const isAdded = createRecipeFormData.ingredients.some(ing => ing.foodId === food.id);
                      return (
                        <motion.button
                          key={food.id}
                          type="button"
                          onClick={() => addIngredientToRecipe(food)}
                          disabled={isAdded}
                          whileHover={{ scale: isAdded ? 1 : 1.05 }}
                          whileTap={{ scale: isAdded ? 1 : 0.95 }}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            isAdded 
                              ? 'bg-green-50 border-green-200 cursor-not-allowed' 
                              : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isAdded ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {renderIcon(food.icon || 'ChefHat', `w-4 h-4 ${isAdded ? 'text-green-600' : 'text-gray-600'}`)}
                            </div>
                            <span className={`text-xs font-medium text-center ${
                              isAdded ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {food.name}
                            </span>
                            {isAdded && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrucciones de Preparación *
                  </label>
                  <textarea
                    value={createRecipeFormData.instructions}
                    onChange={(e) => setCreateRecipeFormData({ ...createRecipeFormData, instructions: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={6}
                    placeholder="Describe paso a paso cómo preparar la receta..."
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateRecipeModal}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isCreatingRecipe}
                    className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:text-purple-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    {isCreatingRecipe ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Crear Receta</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeCreateModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-strong"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nuevo Ingrediente
                </h3>
                <button
                  onClick={closeCreateModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ej: Tomate"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={createFormData.category}
                      onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Descripción del ingrediente..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={createFormData.image}
                    onChange={(e) => setCreateFormData({ ...createFormData, image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida
                    </label>
                    <select
                      value={createFormData.unit}
                      onChange={(e) => setCreateFormData({ ...createFormData, unit: e.target.value as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icono
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {renderIcon(createFormData.icon, "w-6 h-6 text-gray-600")}
                      </div>
                      <select
                        value={createFormData.icon}
                        onChange={(e) => setCreateFormData({ ...createFormData, icon: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="ChefHat">ChefHat</option>
                        <option value="Apple">Apple</option>
                        <option value="Banana">Banana</option>
                        <option value="Carrot">Carrot</option>
                        <option value="Cherry">Cherry</option>
                        <option value="Coffee">Coffee</option>
                        <option value="Cookie">Cookie</option>
                        <option value="Egg">Egg</option>
                        <option value="Fish">Fish</option>
                        <option value="Grape">Grape</option>
                        <option value="IceCream">IceCream</option>
                        <option value="Milk">Milk</option>
                        <option value="Pizza">Pizza</option>
                        <option value="Sandwich">Sandwich</option>
                        <option value="Utensils">Utensils</option>
                        <option value="Wine">Wine</option>
                        <option value="Beef">Beef</option>
                        <option value="Croissant">Croissant</option>
                        <option value="Drumstick">Drumstick</option>
                        <option value="Hamburger">Hamburger</option>
                        <option value="IceCream2">IceCream2</option>
                        <option value="Salad">Salad</option>
                        <option value="Soup">Soup</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Leaf">Leaf</option>
                        <option value="Droplets">Droplets</option>
                        <option value="Package">Package</option>
                        <option value="Zap">Zap</option>
                        <option value="Circle">Circle</option>
                        <option value="Square">Square</option>
                        <option value="Triangle">Triangle</option>
                        <option value="Heart">Heart</option>
                        <option value="Star">Star</option>
                        <option value="Sun">Sun</option>
                        <option value="Moon">Moon</option>
                        <option value="Cloud">Cloud</option>
                        <option value="Flame">Flame</option>
                        <option value="Snowflake">Snowflake</option>
                        <option value="Flower">Flower</option>
                        <option value="TreePine">TreePine</option>
                        <option value="Bug">Bug</option>
                        <option value="Bird">Bird</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:text-green-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    {isCreating ? (
                      <>
                        <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Creando...</span>
                    </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Crear Ingrediente</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeEditModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-strong"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Editar Ingrediente
                </h3>
                <button
                  onClick={closeEditModal}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ej: Tomate"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Descripción del ingrediente..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={editFormData.image}
                    onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida
                    </label>
                    <select
                      value={editFormData.unit}
                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icono
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {renderIcon(editFormData.icon, "w-6 h-6 text-gray-600")}
                      </div>
                      <select
                        value={editFormData.icon}
                        onChange={(e) => setEditFormData({ ...editFormData, icon: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="ChefHat">ChefHat</option>
                        <option value="Apple">Apple</option>
                        <option value="Banana">Banana</option>
                        <option value="Carrot">Carrot</option>
                        <option value="Cherry">Cherry</option>
                        <option value="Coffee">Coffee</option>
                        <option value="Cookie">Cookie</option>
                        <option value="Egg">Egg</option>
                        <option value="Fish">Fish</option>
                        <option value="Grape">Grape</option>
                        <option value="IceCream">IceCream</option>
                        <option value="Milk">Milk</option>
                        <option value="Pizza">Pizza</option>
                        <option value="Sandwich">Sandwich</option>
                        <option value="Utensils">Utensils</option>
                        <option value="Wine">Wine</option>
                        <option value="Beef">Beef</option>
                        <option value="Croissant">Croissant</option>
                        <option value="Drumstick">Drumstick</option>
                        <option value="Hamburger">Hamburger</option>
                        <option value="IceCream2">IceCream2</option>
                        <option value="Salad">Salad</option>
                        <option value="Soup">Soup</option>
                        <option value="Wheat">Wheat</option>
                        <option value="Leaf">Leaf</option>
                        <option value="Droplets">Droplets</option>
                        <option value="Package">Package</option>
                        <option value="Zap">Zap</option>
                        <option value="Circle">Circle</option>
                        <option value="Square">Square</option>
                        <option value="Triangle">Triangle</option>
                        <option value="Heart">Heart</option>
                        <option value="Star">Star</option>
                        <option value="Sun">Sun</option>
                        <option value="Moon">Moon</option>
                        <option value="Cloud">Cloud</option>
                        <option value="Flame">Flame</option>
                        <option value="Snowflake">Snowflake</option>
                        <option value="Flower">Flower</option>
                        <option value="TreePine">TreePine</option>
                        <option value="Bug">Bug</option>
                        <option value="Bird">Bird</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:text-primary-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-strong"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¿Eliminar ingrediente?
                </h3>
                
                <p className="text-gray-700 mb-6">
                  Esta acción eliminará el ingrediente <strong>{allFoods.find(f => f.id === showDeleteModal)?.name}</strong> de la base de datos.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ Esta acción es irreversible y eliminará el ingrediente para todos los usuarios.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteIngredient(showDeleteModal)}
                    disabled={isDeleting === showDeleteModal}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:text-red-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    {isDeleting === showDeleteModal ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}
