'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChefHat, 
  Sparkles, 
  ArrowRight,
  Plus,
  Star,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Recipe } from '@/types/recipe';
import { UserPreferences } from '@/types/user-preferences';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import RecipeCard from '@/components/RecipeCard';

export default function Recipes() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  
  const recipesPerPage = 6;

  const fetchRecipes = useCallback(async (page: number = currentPage, ingredients: string[] = selectedIngredients, search: string = recipeSearch) => {
    try {
      setLoading(true);
      const offset = (page - 1) * recipesPerPage;
      const ingredientsParam = ingredients.length > 0 ? ingredients.join(',') : '';
      
      const url = new URL('/api/recipes', window.location.origin);
      url.searchParams.set('limit', recipesPerPage.toString());
      url.searchParams.set('offset', offset.toString());
      if (ingredientsParam) {
        url.searchParams.set('ingredients', ingredientsParam);
      }
      if (search) {
        url.searchParams.set('search', search);
      }
      
      const response = await fetch(url.toString());
      const result = await response.json();
      
      if (result.success) {
        setRecipes(result.data || []);
        setTotalRecipes(result.pagination?.total || 0);
        setTotalPages(Math.ceil((result.pagination?.total || 0) / recipesPerPage));
        
        // Extraer ingredientes únicos para el filtro (solo en la primera carga)
        if (page === 1 && ingredients.length === 0 && !search) {
          const allIngredients = new Set<string>();
          result.data?.forEach((recipe: Recipe) => {
            const recipeIngredients = formatIngredients(recipe.ingredients);
            recipeIngredients.forEach(ing => allIngredients.add(ing.name));
          });
          setAvailableIngredients(Array.from(allIngredients).sort());
        }
      }
    } catch {
      console.error('Error fetching recipes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedIngredients, recipeSearch]);

  useEffect(() => {
    if (session) {
      fetchRecipes();
    }
  }, [session, fetchRecipes]);

  // Cargar preferencias del usuario
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const preferences = await response.json();
          setUserPreferences(preferences);
        }
      } catch (error) {
        console.error('Error cargando preferencias del usuario:', error);
      }
    };

    if (session) {
      fetchUserPreferences();
    }
  }, [session]);

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const formatIngredients = (ingredientsJson: string) => {
    try {
      const ingredients = JSON.parse(ingredientsJson) as Array<{ name: string }>;
      return ingredients;
    } catch {
      return [];
    }
  };


  // Funciones para filtros y paginación
  const handleIngredientFilter = (ingredient: string) => {
    const newIngredients = selectedIngredients.includes(ingredient)
      ? selectedIngredients.filter(ing => ing !== ingredient)
      : [...selectedIngredients, ingredient];
    
    setSelectedIngredients(newIngredients);
    setCurrentPage(1);
    fetchRecipes(1, newIngredients, recipeSearch);
  };

  const handleRecipeSearch = (search: string) => {
    setRecipeSearch(search);
    setCurrentPage(1);
    
    // Debounce para evitar demasiadas llamadas a la API
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      fetchRecipes(1, selectedIngredients, search);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const clearFilters = () => {
    setSelectedIngredients([]);
    setSearchTerm('');
    setRecipeSearch('');
    setCurrentPage(1);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    fetchRecipes(1, [], '');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRecipes(page, selectedIngredients, recipeSearch);
  };

  // Funciones para editar y eliminar recetas
  const handleEditRecipe = (recipeId: string) => {
    setEditingRecipe(recipeId);
  };

  const handleSaveEdit = async (recipeId: string, updatedData: Partial<Recipe>) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setEditingRecipe(null);
        // Recargar las recetas
        fetchRecipes(currentPage, selectedIngredients, recipeSearch);
      } else {
        console.error('Error al actualizar receta');
      }
    } catch (error) {
      console.error('Error al actualizar receta:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteConfirm(null);
        // Recargar las recetas
        fetchRecipes(currentPage, selectedIngredients, recipeSearch);
      } else {
        console.error('Error al eliminar receta');
      }
    } catch (error) {
      console.error('Error al eliminar receta:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllRecipes = async () => {
    try {
      setIsDeletingAll(true);
      
      const response = await fetch('/api/recipes/delete-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setShowDeleteAllModal(false);
        // Recargar las recetas
        fetchRecipes(1, [], '');
        alert(`Se eliminaron ${result.data.deletedRecipes} recetas y ${result.data.deletedCalendarEntries} entradas del calendario exitosamente`);
      } else {
        alert(result.error || 'Error al eliminar todas las recetas');
      }
    } catch (error) {
      console.error('Error eliminando todas las recetas:', error);
      alert('Error de conexión al eliminar recetas');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-gray-600">Cargando tus recetas...</p>
          </motion.div>
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
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-primary-100 p-4 rounded-2xl"
              >
                <BookOpen className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mis Recetas Generadas
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Recetas creadas con IA basadas en tus ingredientes disponibles
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Filter className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Filtrar por Ingredientes
                  </h2>
                </div>
                <div className="flex items-center space-x-3">
                  {recipes.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteAllModal(true)}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-medium hover:shadow-strong"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Todas</span>
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                    </span>
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selected Ingredients */}
              {selectedIngredients.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Ingredientes seleccionados:
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Limpiar todo</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIngredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="inline-flex items-center space-x-1 bg-primary-600 text-white px-3 py-1 rounded-full text-sm"
                      >
                        <span>{ingredient}</span>
                        <button
                          onClick={() => handleIngredientFilter(ingredient)}
                          className="hover:bg-primary-700 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipe Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar recetas por nombre..."
                    value={recipeSearch}
                    onChange={(e) => handleRecipeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {recipeSearch && (
                    <button
                      onClick={() => handleRecipeSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Toggle */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {/* Search Ingredients */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar ingredientes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Available Ingredients */}
                    <div className="max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {filteredIngredients.map((ingredient) => (
                          <button
                            key={ingredient}
                            onClick={() => handleIngredientFilter(ingredient)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              selectedIngredients.includes(ingredient)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {ingredient}
                          </button>
                        ))}
                      </div>
                      {filteredIngredients.length === 0 && searchTerm && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No se encontraron ingredientes con &quot;{searchTerm}&quot;
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalRecipes}</div>
                  <div className="text-gray-700">
                    {selectedIngredients.length > 0 || recipeSearch 
                      ? 'Recetas encontradas' 
                      : 'Recetas totales'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-100 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-gray-700">Generadas con IA</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">∞</div>
                  <div className="text-gray-700">Posibilidades</div>
                </div>
              </div>
            </div>
          </motion.div>

          {recipes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                {selectedIngredients.length > 0 || recipeSearch ? (
                  <Search className="w-12 h-12 text-primary-600" />
                ) : (
                  <BookOpen className="w-12 h-12 text-primary-600" />
                )}
              </motion.div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {selectedIngredients.length > 0 || recipeSearch 
                  ? 'No se encontraron recetas' 
                  : '¡Aún no tienes recetas!'}
              </h2>
              <p className="text-gray-700 mb-8 max-w-md mx-auto">
                {selectedIngredients.length > 0 || recipeSearch 
                  ? 'Intenta con otros ingredientes o términos de búsqueda'
                  : 'Ve a tu dashboard, selecciona ingredientes y genera tu primera receta con IA'}
              </p>
              
              {selectedIngredients.length > 0 || recipeSearch ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  <X className="w-5 h-5" />
                  <span>Limpiar Filtros</span>
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  <ChefHat className="w-5 h-5" />
                  <span>Ir al Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <AnimatePresence>
                {recipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="relative"
                  >
                    {/* Recipe Card */}
                    <RecipeCard 
                      recipe={recipe}
                      showHealthConditions={true}
                      userPreferences={userPreferences}
                    />
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRecipe(recipe.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors shadow-medium"
                        title="Editar receta"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(recipe.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-medium"
                        title="Eliminar receta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {recipes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              {/* Pagination Info */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} • {totalRecipes} recetas encontradas
                </p>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* CTA Section */}
          {recipes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 text-center"
            >
              <div className="bg-white rounded-2xl p-8 shadow-soft border border-primary-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ¿Quieres crear más recetas?
                </h3>
                <p className="text-gray-700 mb-6">
                  Ve a tu dashboard y experimenta con diferentes combinaciones de ingredientes
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crear Nueva Receta</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Edit Recipe Modal */}
      <AnimatePresence>
        {editingRecipe && (
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
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-strong border border-primary-200"
            >
              <EditRecipeForm
                recipe={recipes.find(r => r.id === editingRecipe)!}
                onSave={(updatedData) => handleSaveEdit(editingRecipe, updatedData)}
                onCancel={() => setEditingRecipe(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-strong border border-primary-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Eliminar Receta
                  </h3>
                  <p className="text-sm text-gray-600">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar esta receta? También se eliminará del planificador de comidas si está programada.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteRecipe(deleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All Recipes Modal */}
      <AnimatePresence>
        {showDeleteAllModal && (
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-strong border border-primary-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ⚠️ Eliminar Todas las Recetas
                </h3>
                
                <p className="text-gray-700 mb-6">
                  Esta acción eliminará <strong>todas las {totalRecipes} recetas</strong> de la base de datos 
                  y también <strong>todas las entradas del calendario de comidas</strong> asociadas.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ Esta acción es irreversible y afectará a todos los usuarios del sistema.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAllRecipes}
                    disabled={isDeletingAll}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:text-red-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    {isDeletingAll ? (
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
                        <span>Eliminar Todas</span>
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

// Componente para editar recetas
interface EditRecipeFormProps {
  recipe: Recipe;
  onSave: (data: Partial<Recipe>) => void;
  onCancel: () => void;
}

function EditRecipeForm({ recipe, onSave, onCancel }: EditRecipeFormProps) {
  const [formData, setFormData] = useState({
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    cookingTime: recipe.cookingTime?.toString() || '',
    difficulty: recipe.difficulty || '',
    servings: recipe.servings?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      cookingTime: formData.cookingTime ? parseInt(formData.cookingTime) : undefined,
      servings: formData.servings ? parseInt(formData.servings) : undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary-100 p-3 rounded-xl">
          <Edit className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Receta
          </h3>
          <p className="text-sm text-gray-600">
            Modifica los detalles de tu receta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instrucciones
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => handleChange('instructions', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        {/* Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo (min)
            </label>
            <input
              type="number"
              value={formData.cookingTime}
              onChange={(e) => handleChange('cookingTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dificultad
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Seleccionar</option>
              <option value="Fácil">Fácil</option>
              <option value="Medio">Medio</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porciones
            </label>
            <input
              type="number"
              value={formData.servings}
              onChange={(e) => handleChange('servings', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </div>
  );
}
