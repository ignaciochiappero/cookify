'use client';

import React from 'react';
import { Heart, Shield, Zap } from 'lucide-react';

interface HealthConditionsBadgeProps {
  healthConditions: string[];
  customHealthConditions: string[];
  className?: string;
}

export default function HealthConditionsBadge({ 
  healthConditions, 
  customHealthConditions, 
  className = "" 
}: HealthConditionsBadgeProps) {
  const allConditions = [...healthConditions, ...customHealthConditions];
  
  if (allConditions.length === 0) {
    return null;
  }

  const getConditionIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('azúcar')) {
      return <Shield className="w-4 h-4" />;
    }
    if (lowerCondition.includes('presión') || lowerCondition.includes('hipertensión')) {
      return <Heart className="w-4 h-4" />;
    }
    if (lowerCondition.includes('colesterol')) {
      return <Zap className="w-4 h-4" />;
    }
    return <Shield className="w-4 h-4" />;
  };

  const getConditionColor = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('diabetes') || lowerCondition.includes('azúcar')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (lowerCondition.includes('presión') || lowerCondition.includes('hipertensión')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (lowerCondition.includes('colesterol')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Shield className="w-4 h-4 text-primary-600" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700">
          Receta ideal para tu salud
        </h4>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {allConditions.map((condition, index) => (
          <div
            key={index}
            className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getConditionColor(condition)}`}
          >
            {getConditionIcon(condition)}
            <span>{condition}</span>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
        💡 Esta receta ha sido adaptada considerando tus condiciones de salud para brindarte los mejores beneficios nutricionales.
      </p>
    </div>
  );
}
