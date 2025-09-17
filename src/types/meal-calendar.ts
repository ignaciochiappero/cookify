export interface MealCalendarItem {
  id: string;
  userId: string;
  date: Date;
  mealType: MealType;
  recipeId?: string;
  customMealName?: string;
  isPlanned: boolean;
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  recipe?: {
    id: string;
    title: string;
    description: string;
    cookingTime?: number;
    difficulty?: string;
    servings?: number;
  };
}

export interface CreateMealCalendarItem {
  date: Date;
  mealType: MealType;
  recipeId?: string;
  customMealName?: string;
  notes?: string;
}

export interface UpdateMealCalendarItem {
  recipeId?: string;
  customMealName?: string;
  isPlanned?: boolean;
  isCompleted?: boolean;
  notes?: string;
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  SNACK = 'SNACK',
  DINNER = 'DINNER'
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Desayuno',
  [MealType.LUNCH]: 'Almuerzo',
  [MealType.SNACK]: 'Merienda',
  [MealType.DINNER]: 'Cena'
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  [MealType.BREAKFAST]: '🌅',
  [MealType.LUNCH]: '☀️',
  [MealType.SNACK]: '🍎',
  [MealType.DINNER]: '🌙'
};

export interface CalendarDay {
  date: Date;
  meals: {
    [key in MealType]: MealCalendarItem | null;
  };
}

export interface MealPlanningOptions {
  suggestIngredients: boolean;
  maxRecipesPerDay: number;
  preferredMealTypes: MealType[];
  avoidRepeatingRecipes: boolean;
}
