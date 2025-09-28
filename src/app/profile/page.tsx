'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  UserPreferences, 
  HEALTH_CONDITIONS, 
  PERSONAL_GOALS, 
  COOKING_SKILL_LABELS, 
  COOKING_TIME_LABELS,
  COUNTRIES 
} from '@/types/user-preferences';

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [customHealthInput, setCustomHealthInput] = useState('');
  const [customGoalInput, setCustomGoalInput] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchPreferences();
    }
  }, [status, router]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        setPreferences(null);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferencias guardadas exitosamente' });
      } else {
        setMessage({ type: 'error', text: 'Error al guardar las preferencias' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Error al guardar las preferencias' });
    } finally {
      setSaving(false);
    }
  };

  const handleHealthConditionToggle = (condition: string) => {
    if (!preferences) return;
    
    setPreferences(prev => ({
      ...prev!,
      healthConditions: prev!.healthConditions.includes(condition)
        ? prev!.healthConditions.filter(c => c !== condition)
        : [...prev!.healthConditions, condition]
    }));
  };

  const handleCustomHealthAdd = () => {
    if (!preferences || !customHealthInput.trim()) return;
    
    setPreferences(prev => ({
      ...prev!,
      customHealthConditions: [...prev!.customHealthConditions, customHealthInput.trim()]
    }));
    setCustomHealthInput('');
  };

  const handleCustomHealthRemove = (condition: string) => {
    if (!preferences) return;
    
    setPreferences(prev => ({
      ...prev!,
      customHealthConditions: prev!.customHealthConditions.filter(c => c !== condition)
    }));
  };

  const handlePersonalGoalToggle = (goal: string) => {
    if (!preferences) return;
    
    setPreferences(prev => ({
      ...prev!,
      personalGoals: prev!.personalGoals.includes(goal)
        ? prev!.personalGoals.filter(g => g !== goal)
        : [...prev!.personalGoals, goal]
    }));
  };

  const handleCustomGoalAdd = () => {
    if (!preferences || !customGoalInput.trim()) return;
    
    setPreferences(prev => ({
      ...prev!,
      customPersonalGoals: [...prev!.customPersonalGoals, customGoalInput.trim()]
    }));
    setCustomGoalInput('');
  };

  const handleCustomGoalRemove = (goal: string) => {
    if (!preferences) return;
    
    setPreferences(prev => ({
      ...prev!,
      customPersonalGoals: prev!.customPersonalGoals.filter(g => g !== goal)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No se encontraron preferencias
            </h2>
            <p className="text-gray-600 mb-6">
              Parece que no has completado tu perfil aún.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Completar perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mi Perfil
            </h1>
            <p className="text-gray-600">
              Personaliza tus preferencias para obtener recetas más adecuadas
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            {/* Condiciones de Salud */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Condiciones de Salud
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {HEALTH_CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => handleHealthConditionToggle(condition)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      preferences.healthConditions.includes(condition)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Otras condiciones
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customHealthInput}
                    onChange={(e) => setCustomHealthInput(e.target.value)}
                    placeholder="Escribe tu condición aquí..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomHealthAdd()}
                  />
                  <button
                    onClick={handleCustomHealthAdd}
                    disabled={!customHealthInput.trim()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {preferences.customHealthConditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.customHealthConditions.map((condition, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-800 rounded-lg"
                      >
                        {condition}
                        <button
                          onClick={() => handleCustomHealthRemove(condition)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Objetivos Personales */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Objetivos Personales
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {PERSONAL_GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => handlePersonalGoalToggle(goal)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      preferences.personalGoals.includes(goal)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Otros objetivos
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="Escribe tu objetivo aquí..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomGoalAdd()}
                  />
                  <button
                    onClick={handleCustomGoalAdd}
                    disabled={!customGoalInput.trim()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {preferences.customPersonalGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.customPersonalGoals.map((goal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-800 rounded-lg"
                      >
                        {goal}
                        <button
                          onClick={() => handleCustomGoalRemove(goal)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Preferencias de Cocina */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Preferencias de Cocina
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ¿Qué tanto te gusta cocinar?
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(COOKING_SKILL_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPreferences(prev => prev ? { ...prev, cookingSkill: key as keyof typeof COOKING_SKILL_LABELS } : prev)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                          preferences.cookingSkill === key
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ¿Cuánto tiempo tienes para cocinar?
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(COOKING_TIME_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPreferences(prev => prev ? { ...prev, cookingTime: key as keyof typeof COOKING_TIME_LABELS } : prev)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                          preferences.cookingTime === key
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Información Demográfica */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información Demográfica
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ¿Para cuántas personas cocinas?
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setPreferences(prev => prev ? { ...prev, servings: Math.max(1, prev.servings - 1) } : prev)}
                      className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <div className="text-4xl font-bold text-primary-600 min-w-[60px] text-center">
                      {preferences.servings}
                    </div>
                    <button
                      onClick={() => setPreferences(prev => prev ? { ...prev, servings: prev.servings + 1 } : prev)}
                      className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ¿Dónde vives?
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        onClick={() => setPreferences(prev => prev ? { ...prev, country } : prev)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          preferences.country === country
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
