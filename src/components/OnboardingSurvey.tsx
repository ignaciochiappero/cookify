'use client';

import React, { useState } from 'react';
import { 
  OnboardingData, 
  HEALTH_CONDITIONS, 
  PERSONAL_GOALS, 
  COOKING_SKILL_LABELS, 
  COOKING_TIME_LABELS,
  COUNTRIES 
} from '@/types/user-preferences';

interface OnboardingSurveyProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export default function OnboardingSurvey({ onComplete, onSkip }: OnboardingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    healthConditions: [],
    customHealthConditions: [],
    personalGoals: [],
    customPersonalGoals: [],
    cookingSkill: 'mas_o_menos',
    cookingTime: 'mas_o_menos',
    servings: 2,
    country: undefined,
    locationEnabled: false
  });

  const [customHealthInput, setCustomHealthInput] = useState('');
  const [customGoalInput, setCustomGoalInput] = useState('');

  const totalSteps = 5;

  const handleHealthConditionToggle = (condition: string) => {
    setData(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(condition)
        ? prev.healthConditions.filter(c => c !== condition)
        : [...prev.healthConditions, condition]
    }));
  };

  const handleCustomHealthAdd = () => {
    if (customHealthInput.trim()) {
      setData(prev => ({
        ...prev,
        customHealthConditions: [...prev.customHealthConditions, customHealthInput.trim()]
      }));
      setCustomHealthInput('');
    }
  };

  const handleCustomHealthRemove = (condition: string) => {
    setData(prev => ({
      ...prev,
      customHealthConditions: prev.customHealthConditions.filter(c => c !== condition)
    }));
  };

  const handlePersonalGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      personalGoals: prev.personalGoals.includes(goal)
        ? prev.personalGoals.filter(g => g !== goal)
        : [...prev.personalGoals, goal]
    }));
  };

  const handleCustomGoalAdd = () => {
    if (customGoalInput.trim()) {
      setData(prev => ({
        ...prev,
        customPersonalGoals: [...prev.customPersonalGoals, customGoalInput.trim()]
      }));
      setCustomGoalInput('');
    }
  };

  const handleCustomGoalRemove = (goal: string) => {
    setData(prev => ({
      ...prev,
      customPersonalGoals: prev.customPersonalGoals.filter(g => g !== goal)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Sufres algunas de estas patologías?
        </h2>
        <p className="text-gray-600">
          Esta información nos ayudará a generar recetas más adecuadas para tu salud
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {HEALTH_CONDITIONS.map((condition) => (
          <button
            key={condition}
            onClick={() => handleHealthConditionToggle(condition)}
            className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              data.healthConditions.includes(condition)
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
          ¿Tienes alguna otra condición?
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

        {data.customHealthConditions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.customHealthConditions.map((condition, index) => (
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Tienes algún objetivo personal respecto a la alimentación?
        </h2>
        <p className="text-gray-600">
          Esto nos ayudará a personalizar mejor tus recetas
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PERSONAL_GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => handlePersonalGoalToggle(goal)}
            className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              data.personalGoals.includes(goal)
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
          ¿Tienes algún otro objetivo?
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

        {data.customPersonalGoals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.customPersonalGoals.map((goal, index) => (
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
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Qué tanto te gusta cocinar?
        </h2>
        <p className="text-gray-600">
          Esto nos ayudará a sugerir recetas con el nivel de complejidad adecuado
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(COOKING_SKILL_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setData(prev => ({ ...prev, cookingSkill: key as keyof typeof COOKING_SKILL_LABELS }))}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
              data.cookingSkill === key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          ¿Cuánto tiempo tienes para cocinar en el día a día?
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(COOKING_TIME_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setData(prev => ({ ...prev, cookingTime: key as keyof typeof COOKING_TIME_LABELS }))}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
              data.cookingTime === key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Para cuántas personas sueles cocinar?
        </h2>
        <p className="text-gray-600">
          Esto nos ayudará a calcular las porciones correctas en tus recetas
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setData(prev => ({ ...prev, servings: Math.max(1, prev.servings - 1) }))}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold transition-colors"
          >
            -
          </button>
          <div className="text-4xl font-bold text-primary-600 min-w-[60px] text-center">
            {data.servings}
          </div>
          <button
            onClick={() => setData(prev => ({ ...prev, servings: prev.servings + 1 }))}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold transition-colors"
          >
            +
          </button>
        </div>
        <p className="text-center text-gray-600 mt-4">
          {data.servings === 1 ? 'persona' : 'personas'}
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Dónde vives?
        </h2>
        <p className="text-gray-600">
          Esto nos ayudará a sugerir recetas típicas de tu región
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {COUNTRIES.map((country) => (
            <button
              key={country}
              onClick={() => setData(prev => ({ ...prev, country }))}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                data.country === country
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {country}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.locationEnabled}
              onChange={(e) => setData(prev => ({ ...prev, locationEnabled: e.target.checked }))}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">
              Permitir acceso a mi ubicación para una experiencia más personalizada
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Paso {currentStep} de {totalSteps}
              </span>
              <span className="text-sm font-medium text-primary-600">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderCurrentStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            <div className="flex space-x-3">
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Omitir por ahora
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                {currentStep === totalSteps ? 'Completar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
