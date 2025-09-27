import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

// Configuración para LM Studio local
const provider = createOpenAICompatible({
  name: "local-gemma",
  baseURL: "http://192.168.80.1:1234/v1",
  apiKey: "sk-no-key-required", // Para modelos locales generalmente no se requiere API key
});

export const model = provider("google/gemma-3-4b");

// Esquemas para validación de respuestas
const RecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  cookingTime: z.number(),
  difficulty: z.string(),
  servings: z.number(),
  suggestedIngredients: z.array(z.string()).optional(),
});

const DetectedIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.enum([
    "PIECE",
    "GRAM",
    "KILOGRAM",
    "LITER",
    "MILLILITER",
    "CUP",
    "TABLESPOON",
    "TEASPOON",
    "POUND",
    "OUNCE",
  ]),
  category: z.enum([
    "VEGETABLE",
    "FRUIT",
    "MEAT",
    "DAIRY",
    "GRAIN",
    "LIQUID",
    "SPICE",
    "OTHER",
  ]),
  confidence: z.number(),
});

const AnalysisSchema = z.object({
  detectedIngredients: z.array(DetectedIngredientSchema),
  missingIngredients: z.array(DetectedIngredientSchema),
  suggestions: z.array(z.string()),
});

const MealPlanSchema = z.object({
  mealPlan: z.array(
    z.object({
      date: z.string(),
      meals: z.object({
        breakfast: z
          .object({
            recipeId: z.string(),
            title: z.string(),
            ingredients: z.array(z.string()),
          })
          .optional(),
        lunch: z
          .object({
            recipeId: z.string(),
            title: z.string(),
            ingredients: z.array(z.string()),
          })
          .optional(),
        snack: z
          .object({
            recipeId: z.string(),
            title: z.string(),
            ingredients: z.array(z.string()),
          })
          .optional(),
        dinner: z
          .object({
            recipeId: z.string(),
            title: z.string(),
            ingredients: z.array(z.string()),
          })
          .optional(),
      }),
    })
  ),
});

export { RecipeSchema, AnalysisSchema, MealPlanSchema };
