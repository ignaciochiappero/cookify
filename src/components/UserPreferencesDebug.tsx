'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences } from '@/types/user-preferences';

export default function UserPreferencesDebug() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        } else {
          console.error('Error cargando preferencias:', response.status);
        }
      } catch (error) {
        console.error('Error cargando preferencias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">Cargando preferencias del usuario...</p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🔍 DEBUG: Preferencias del Usuario
      </h3>
      
      {preferences ? (
        <div className="space-y-2 text-sm">
          <div>
            <strong>Health Conditions:</strong> {preferences.healthConditions?.length || 0} condiciones
            {preferences.healthConditions?.length > 0 && (
              <ul className="ml-4 list-disc">
                {preferences.healthConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <strong>Custom Health Conditions:</strong> {preferences.customHealthConditions?.length || 0} condiciones
            {preferences.customHealthConditions?.length > 0 && (
              <ul className="ml-4 list-disc">
                {preferences.customHealthConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <strong>Personal Goals:</strong> {preferences.personalGoals?.length || 0} objetivos
            {preferences.personalGoals?.length > 0 && (
              <ul className="ml-4 list-disc">
                {preferences.personalGoals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <strong>Cooking Skill:</strong> {preferences.cookingSkill || 'No especificado'}
          </div>
          
          <div>
            <strong>Cooking Time:</strong> {preferences.cookingTime || 'No especificado'}
          </div>
          
          <div>
            <strong>Servings:</strong> {preferences.servings || 'No especificado'}
          </div>
          
          <div>
            <strong>Country:</strong> {preferences.country || 'No especificado'}
          </div>
        </div>
      ) : (
        <p className="text-yellow-800">
          ❌ No se encontraron preferencias del usuario. 
          <a href="/onboarding" className="text-blue-600 underline ml-1">
            Completar onboarding
          </a>
        </p>
      )}
    </div>
  );
}
