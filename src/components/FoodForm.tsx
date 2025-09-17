'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { foodSchema, FoodFormData } from '@/schemas/foodSchema';
import { Food } from '@/types/food';

interface FoodFormProps {
  food?: Food;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FoodForm({ food, onSuccess, onCancel }: FoodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const isEditing = !!food;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FoodFormData>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: food?.name || '',
      description: food?.description || '',
      image: food?.image || ''
    }
  });

  const onSubmit = async (data: FoodFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const url = isEditing ? `/api/food/${food.id}` : '/api/food';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la solicitud');
      }

      // Limpiar formulario y notificar éxito
      reset();
      onSuccess?.();
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? '✏️ Editar Verdura' : '➕ Agregar Nueva Verdura'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ej: Tomate, Lechuga, Zanahoria..."
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describe las características y beneficios de esta verdura..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Imagen */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL de Imagen
          </label>
          <input
            {...register('image')}
            type="url"
            id="image"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://ejemplo.com/imagen.jpg"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.image.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Si no proporcionas una imagen, se usará una por defecto
          </p>
        </div>

        {/* Error de envío */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:text-green-100 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                {isEditing ? '✏️ Actualizar' : '➕ Crear Verdura'}
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
