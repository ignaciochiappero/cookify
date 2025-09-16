'use client';

import { useState, useEffect } from 'react';
import { Food } from '@/types/food';
import FoodCard from './FoodCard';
import FoodForm from './FoodForm';

export default function FoodManager() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);

  // Cargar datos
  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food');
      const result = await response.json();
      
      if (result.success) {
        setFoods(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Error al cargar los datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // Crear nueva verdura
  const handleCreate = () => {
    setEditingFood(null);
    setShowForm(true);
  };

  // Editar verdura
  const handleEdit = (food: Food) => {
    setEditingFood(food);
    setShowForm(true);
  };

  // Eliminar verdura
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/food/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setFoods(foods.filter(food => food.id !== id));
      } else {
        alert(result.error || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFood(null);
  };

  // Éxito en formulario
  const handleFormSuccess = () => {
    fetchFoods(); // Recargar datos
    handleCloseForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchFoods}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header con botón de agregar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🥗 Gestión de Verduras
        </h2>
        <button
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          ➕ Agregar Verdura
        </button>
      </div>

      {/* Formulario modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <FoodForm
              food={editingFood || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}

      {/* Grid de verduras */}
      {foods.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🥬</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay verduras disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Agrega tu primera verdura usando el botón de arriba
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {foods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
