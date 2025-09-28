export interface UserPreferences {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Información de salud
  healthConditions: string[];
  customHealthConditions: string[];
  
  // Objetivos personales
  personalGoals: string[];
  customPersonalGoals: string[];
  
  // Preferencias de cocina
  cookingSkill: 'mucho' | 'mas_o_menos' | 'poco';
  cookingTime: 'mucho' | 'mas_o_menos' | 'poco';
  
  // Información demográfica
  servings: number;
  country?: string;
  locationEnabled: boolean;
}

export interface OnboardingData {
  // Pregunta 1: Condiciones de salud
  healthConditions: string[];
  customHealthConditions: string[];
  
  // Pregunta 2: Objetivos personales
  personalGoals: string[];
  customPersonalGoals: string[];
  
  // Pregunta 3: Preferencias de cocina
  cookingSkill: 'mucho' | 'mas_o_menos' | 'poco';
  cookingTime: 'mucho' | 'mas_o_menos' | 'poco';
  
  // Pregunta 4: Número de personas
  servings: number;
  
  // Pregunta 5: Ubicación
  country?: string;
  locationEnabled: boolean;
}

// Opciones predefinidas para las encuestas
export const HEALTH_CONDITIONS = [
  'Diabetes',
  'Celiaquía',
  'Presión alta',
  'Colesterol alto',
  'Intolerancia a la lactosa',
  'Síndrome del intestino irritable',
  'Enfermedad celíaca',
  'Hipertensión',
  'Obesidad',
  'Anemia',
  'Gastritis',
  'Reflujo gastroesofágico'
];

export const PERSONAL_GOALS = [
  'Bajar de peso',
  'Subir de peso',
  'Comer más saludable',
  'Ganar masa muscular',
  'Mantener peso actual',
  'Mejorar digestión',
  'Reducir colesterol',
  'Controlar diabetes',
  'Aumentar energía',
  'Mejorar rendimiento deportivo',
  'Reducir inflamación',
  'Fortalecer sistema inmunológico'
];

export const COOKING_SKILL_LABELS = {
  mucho: 'Me encanta cocinar',
  mas_o_menos: 'Cocino ocasionalmente',
  poco: 'Prefiero comidas simples'
};

export const COOKING_TIME_LABELS = {
  mucho: 'Tengo tiempo para cocinar',
  mas_o_menos: 'Tiempo moderado',
  poco: 'Necesito comidas rápidas'
};

export const COUNTRIES = [
  'Argentina',
  'Brasil',
  'Chile',
  'Colombia',
  'México',
  'Perú',
  'Uruguay',
  'Venezuela',
  'España',
  'Estados Unidos',
  'Francia',
  'Italia',
  'Japón',
  'China',
  'India',
  'Otro'
];
