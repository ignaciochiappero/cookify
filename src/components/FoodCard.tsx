'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Food } from '@/types/food';

interface FoodCardProps {
  food: Food;
  onEdit?: (food: Food) => void;
  onDelete?: (id: string) => void;
}

export default function FoodCard({ food, onEdit, onDelete }: FoodCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${food.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(food.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full">
        <Image
          src={food.image}
          alt={food.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {food.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
          {food.description}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>ID: {food.id.slice(0, 8)}...</span>
          <span>
            {new Date(food.createdAt).toLocaleDateString('es-ES')}
          </span>
        </div>
        
        {/* Botones de acción */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            {onEdit && (
              <button
                onClick={() => onEdit(food)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-200"
              >
                ✏️ Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:text-red-100 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors duration-200"
              >
                {isDeleting ? '🗑️...' : '🗑️ Eliminar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
