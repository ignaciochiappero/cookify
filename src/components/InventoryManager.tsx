'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  IngredientInventory, 
  CreateInventoryItem, 
  FoodCategory,
  FoodUnit,
  FOOD_CATEGORY_LABELS,
  FOOD_UNIT_LABELS,
  FOOD_UNIT_ABBREVIATIONS
} from '@/types/inventory';

interface Food {
  id: string;
  name: string;
  description: string;
  image: string;
  category: FoodCategory;
  unit: FoodUnit;
}

interface InventoryManagerProps {
  foods: Food[];
}

export default function InventoryManager({ foods }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<IngredientInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IngredientInventory | null>(null);
  const [formData, setFormData] = useState<CreateInventoryItem>({
    foodId: '',
    quantity: 0,
    unit: FoodUnit.PIECE,
    expirationDate: undefined,
    notes: ''
  });

  // Cargar inventario
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInventory(result.data || []);
        } else {
          setInventory([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchInventory();
        resetForm();
      }
    } catch (error) {
      console.error('Error al guardar inventario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingrediente del inventario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchInventory();
      }
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
    }
  };

  const handleEdit = (item: IngredientInventory) => {
    setEditingItem(item);
    setFormData({
      foodId: item.foodId,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expirationDate,
      notes: item.notes || ''
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      foodId: '',
      quantity: 0,
      unit: FoodUnit.PIECE,
      expirationDate: undefined,
      notes: ''
    });
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const getExpirationStatus = (expirationDate?: Date) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'good';
  };

  const getExpirationIcon = (status: string | null) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'expiring': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getExpirationText = (expirationDate?: Date) => {
    if (!expirationDate) return 'Sin fecha de vencimiento';
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Vencido hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    if (diffDays <= 3) return `Vence en ${diffDays} días`;
    return `Vence en ${diffDays} días`;
  };

  if (isLoading && inventory.length === 0) {
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mi Inventario de Ingredientes
          </h2>
          <p className="text-gray-600">
            Gestiona las cantidades y fechas de vencimiento de tus ingredientes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar Ingrediente</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
              <div className="text-gray-600">Ingredientes</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'good').length}
              </div>
              <div className="text-gray-600">En buen estado</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'expiring').length}
              </div>
              <div className="text-gray-600">Por vencer</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'expired').length}
              </div>
              <div className="text-gray-600">Vencidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {inventory.map((item, index) => {
            const food = item.food;
            const expirationStatus = getExpirationStatus(item.expirationDate);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-soft border border-primary-200 hover:shadow-medium transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{food.name}</h3>
                      <p className="text-sm text-gray-600">{FOOD_CATEGORY_LABELS[food.category]}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cantidad:</span>
                    <span className="font-medium text-gray-900">
                      {item.quantity} {FOOD_UNIT_ABBREVIATIONS[item.unit]}
                    </span>
                  </div>

                  {item.expirationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vencimiento:</span>
                      <div className="flex items-center space-x-2">
                        {getExpirationIcon(expirationStatus)}
                        <span className={`text-sm font-medium ${
                          expirationStatus === 'expired' ? 'text-red-600' :
                          expirationStatus === 'expiring' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {getExpirationText(item.expirationDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <div>
                      <span className="text-sm text-gray-600">Notas:</span>
                      <p className="text-sm text-gray-800 mt-1">{item.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {inventory.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tu inventario está vacío
          </h3>
          <p className="text-gray-600 mb-6">
            Agrega ingredientes con sus cantidades para comenzar a planificar tus comidas
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
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingrediente *
                  </label>
                  <select
                    value={formData.foodId}
                    onChange={(e) => setFormData({ ...formData, foodId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Selecciona un ingrediente</option>
                    {foods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({FOOD_CATEGORY_LABELS[food.category]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as FoodUnit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      {Object.values(FoodUnit).map((unit) => (
                        <option key={unit} value={unit}>
                          {FOOD_UNIT_LABELS[unit]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate ? new Date(formData.expirationDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      expirationDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Notas adicionales sobre este ingrediente..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:text-primary-100 text-white rounded-md transition-colors"
                  >
                    {isLoading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Agregar')}
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
