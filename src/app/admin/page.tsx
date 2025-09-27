'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  ChefHat, 
  Save, 
  X,
  Users,
  Sparkles,
  // Iconos de comida disponibles
  Apple,
  Banana,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Egg,
  Fish,
  Grape,
  IceCream,
  Milk,
  Pizza,
  Sandwich,
  Utensils,
  Wine,
  Beef,
  Croissant,
  Drumstick,
  Hamburger,
  IceCream2,
  Salad,
  Soup,
  Wheat,
  // Iconos adicionales
  Leaf,
  Droplets,
  Package,
  Zap,
  Circle,
  Square,
  Triangle,
  Heart,
  Star,
  Sun,
  Moon,
  Cloud,
  Flame,
  Snowflake,
  Flower,
  TreePine,
  Bug,
  Bird,
  Fish as FishIcon
} from 'lucide-react';
import { Food } from '@/types/food';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getLucideIcon } from '@/lib/iconUtils';

// Iconos de comida disponibles
const foodIcons = [
  { name: 'Apple', component: Apple },
  { name: 'Banana', component: Banana },
  { name: 'Carrot', component: Carrot },
  { name: 'Cherry', component: Cherry },
  { name: 'Coffee', component: Coffee },
  { name: 'Cookie', component: Cookie },
  { name: 'Egg', component: Egg },
  { name: 'Fish', component: Fish },
  { name: 'Grape', component: Grape },
  { name: 'IceCream', component: IceCream },
  { name: 'Milk', component: Milk },
  { name: 'Pizza', component: Pizza },
  { name: 'Sandwich', component: Sandwich },
  { name: 'Utensils', component: Utensils },
  { name: 'Wine', component: Wine },
  { name: 'Beef', component: Beef },
  { name: 'Croissant', component: Croissant },
  { name: 'Drumstick', component: Drumstick },
  { name: 'FishIcon', component: FishIcon },
  { name: 'Hamburger', component: Hamburger },
  { name: 'IceCream2', component: IceCream2 },
  { name: 'Salad', component: Salad },
  { name: 'Soup', component: Soup },
  { name: 'Wheat', component: Wheat },
  { name: 'Leaf', component: Leaf },
  { name: 'Droplets', component: Droplets },
  { name: 'Package', component: Package },
  { name: 'Zap', component: Zap },
  { name: 'Circle', component: Circle },
  { name: 'Square', component: Square },
  { name: 'Triangle', component: Triangle },
  { name: 'Heart', component: Heart },
  { name: 'Star', component: Star },
  { name: 'Sun', component: Sun },
  { name: 'Moon', component: Moon },
  { name: 'Cloud', component: Cloud },
  { name: 'Flame', component: Flame },
  { name: 'Snowflake', component: Snowflake },
  { name: 'Flower', component: Flower },
  { name: 'TreePine', component: TreePine },
  { name: 'Bug', component: Bug },
  { name: 'Bird', component: Bird }
];

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

export default function Admin() {
  const { data: session } = useSession();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'ChefHat',
    category: 'VEGETABLE' as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER',
    unit: 'PIECE' as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE'
  });

  useEffect(() => {
    if (session) {
      fetchFoods();
    }
  }, [session]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food');
      const result = await response.json();
      
      if (result.success) {
        setFoods(result.data || []);
      }
    } catch {
      console.error('Error fetching foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      const url = editingFood ? `/api/food/${editingFood.id}` : '/api/food';
      const method = editingFood ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchFoods();
        resetForm();
        alert(editingFood ? 'Ingrediente actualizado exitosamente' : 'Ingrediente creado exitosamente');
      } else {
        alert(result.error || 'Error al guardar el ingrediente');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description,
      image: food.image,
      icon: food.icon || 'ChefHat',
      category: food.category,
      unit: food.unit
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingrediente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/food/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchFoods();
        alert('Ingrediente eliminado exitosamente');
      } else {
        alert(result.error || 'Error al eliminar el ingrediente');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      
      const response = await fetch('/api/food/delete-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchFoods();
        setShowDeleteAllModal(false);
        alert(`Se eliminaron ${result.data.deletedFoods} ingredientes y ${result.data.deletedInventory} elementos del inventario exitosamente`);
      } else {
        alert(result.error || 'Error al eliminar todos los ingredientes');
      }
    } catch (error) {
      console.error('Error eliminando todos los ingredientes:', error);
      alert('Error de conexión al eliminar ingredientes');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      image: '', 
      icon: 'ChefHat', 
      category: 'VEGETABLE', 
      unit: 'PIECE' 
    });
    setEditingFood(null);
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
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
            <p className="text-gray-600">Cargando panel de administración...</p>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
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
                <Shield className="w-12 h-12 text-primary-600" />
              </motion.div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Panel de Administración
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Gestiona los ingredientes disponibles en la aplicación
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <ChefHat className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{foods.length}</div>
                  <div className="text-gray-700">Ingredientes totales</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">Admin</div>
                  <div className="text-gray-700">Rol de usuario</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">IA</div>
                  <div className="text-gray-700">Generación activa</div>
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
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Gestión de Ingredientes
                </h2>
                <p className="text-gray-700">
                  Agrega, edita o elimina ingredientes del sistema
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                >
                  <Plus className="w-5 h-5" />
                  <span>Agregar Ingrediente</span>
                </motion.button>
                
                {foods.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteAllModal(true)}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Eliminar Todos</span>
                  </motion.button>
                )}
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
              {foods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-primary-200"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
                      {(() => {
                        const IconComponent = getLucideIcon(food.icon || 'ChefHat');
                        return <IconComponent className="w-8 h-8 text-primary-600" />;
                      })()}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {food.name}
                    </h3>
                    
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {food.description}
                    </p>
                    
                    {/* Category and Unit Info */}
                    <div className="flex items-center justify-center space-x-3 mb-4 text-xs">
                      <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        {categories.find(c => c.value === food.category)?.label || 'Vegetal'}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {units.find(u => u.value === food.unit)?.label || 'Piezas'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(food)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-primary-100 hover:bg-primary-200 text-primary-700 font-medium py-2 px-3 rounded-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Editar</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(food.id)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Eliminar</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {foods.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🥬</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No hay ingredientes disponibles
              </h2>
              <p className="text-gray-700 mb-6">
                Comienza agregando tu primer ingrediente al sistema
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFormOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
              >
                Agregar Primer Ingrediente
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Modal Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && resetForm()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-strong"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingFood ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ej: Tomate"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icono
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {foodIcons.map((iconData) => {
                        const IconComponent = iconData.component;
                        return (
                          <button
                            key={iconData.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconData.name })}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                              formData.icon === iconData.name
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de Medida
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        {units.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:text-primary-100 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                    >
                      {saving ? (
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
                          <Save className="w-4 h-4" />
                          <span>{editingFood ? 'Actualizar' : 'Crear'}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Confirmación para Eliminar Todos */}
        <AnimatePresence>
          {showDeleteAllModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowDeleteAllModal(false)}
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
                    ⚠️ Eliminar Todos los Ingredientes
                  </h3>
                  
                  <p className="text-gray-700 mb-6">
                    Esta acción eliminará <strong>todos los {foods.length} ingredientes</strong> de la base de datos 
                    y también <strong>todos los elementos del inventario</strong> de todos los usuarios.
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
                      onClick={handleDeleteAll}
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
                          <span>Eliminar Todos</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}