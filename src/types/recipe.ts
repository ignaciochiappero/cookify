export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string; // JSON string
  instructions: string;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
  healthConditions?: string[];
  customHealthConditions?: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  image: string;
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  instructions: string;
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

export interface RecipeGenerationRequest {
  ingredients: RecipeIngredient[];
  preferences?: {
    cookingTime?: number;
    difficulty?: string;
    servings?: number;
    dietaryRestrictions?: string[];
  };
}
