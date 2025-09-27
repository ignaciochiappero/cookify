import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Tipos para la función centralizada
export interface RecipeData {
  title: string;
  description: string;
  instructions: string;
  cookingTime: number;
  difficulty: string;
  servings: number;
  suggestedIngredients?: string[];
}

export interface RecipeCreationOptions {
  ingredients: unknown[];
  userId: string;
  customTitle?: string;
  customDescription?: string;
  customServings?: number;
  customCookingTime?: number;
  customDifficulty?: string;
}

export interface RecipeResponse {
  success: boolean;
  recipe?: unknown;
  suggestedIngredients?: string[];
  fromCache?: boolean;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Función centralizada para crear recetas en la base de datos
 * Unifica toda la lógica duplicada de creación de recetas
 */
export async function createRecipe(
  recipeData: RecipeData,
  options: RecipeCreationOptions
): Promise<RecipeResponse> {
  try {
    // Validar datos requeridos
    if (
      !recipeData.title ||
      !recipeData.description ||
      !recipeData.instructions
    ) {
      return {
        success: false,
        error: "Datos de receta incompletos",
        details: "Faltan campos requeridos: title, description, instructions",
      };
    }

    // Aplicar personalizaciones si existen
    const finalTitle = options.customTitle || recipeData.title;
    const finalDescription =
      options.customDescription || recipeData.description;
    const finalServings = options.customServings || recipeData.servings;
    const finalCookingTime =
      options.customCookingTime || recipeData.cookingTime;
    const finalDifficulty = options.customDifficulty || recipeData.difficulty;

    // Crear receta en la base de datos
    const recipe = await prisma.recipe.create({
      data: {
        title: finalTitle,
        description: finalDescription,
        ingredients: JSON.stringify(options.ingredients),
        instructions: recipeData.instructions,
        cookingTime: finalCookingTime,
        difficulty: finalDifficulty,
        servings: finalServings,
        userId: options.userId,
      },
    });

    return {
      success: true,
      recipe,
      suggestedIngredients: recipeData.suggestedIngredients || [],
      message: "Receta creada exitosamente",
    };
  } catch (error) {
    console.error("Error al crear receta:", error);

    return {
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Función centralizada para verificar autenticación
 * Unifica la lógica de autenticación duplicada
 */
export async function verifyAuthentication(): Promise<{
  success: boolean;
  userId?: string;
  error?: NextResponse;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
      };
    }

    return {
      success: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error("Error en verificación de autenticación:", error);
    return {
      success: false,
      error: NextResponse.json(
        { error: "Error de autenticación" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Función centralizada para manejo de errores
 * Unifica el manejo de errores duplicado
 */
export function handleRecipeError(
  error: unknown,
  context: string
): NextResponse {
  console.error(`Error en ${context}:`, error);

  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }

  return NextResponse.json(
    {
      success: false,
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    },
    { status: 500 }
  );
}

/**
 * Función para formatear ingredientes del inventario
 * Unifica la lógica de formateo de ingredientes
 */
export function formatInventoryIngredients(inventory: unknown[]): unknown[] {
  return inventory.map((item) => {
    const itemData = item as Record<string, unknown>;
    return {
      name: (itemData.food as Record<string, unknown>)?.name || itemData.name,
      quantity: itemData.quantity || 1,
      unit: itemData.unit || "PIECE",
      category: (itemData.food as Record<string, unknown>)?.category || itemData.category || "OTHER",
    };
  });
}

/**
 * Función para formatear ingredientes específicos
 * Convierte array de strings a formato de ingredientes
 */
export function formatSpecificIngredients(ingredients: string[]): unknown[] {
  return ingredients.map((ingredient) => ({
    name: ingredient,
    quantity: 1,
    unit: "PIECE" as const,
  }));
}

/**
 * Función para validar datos de receta
 */
export function validateRecipeData(data: unknown): {
  isValid: boolean;
  error?: string;
} {
  const recipeData = data as Record<string, unknown>;
  
  if (!recipeData.title || typeof recipeData.title !== "string") {
    return { isValid: false, error: "Título de receta requerido" };
  }

  if (!recipeData.description || typeof recipeData.description !== "string") {
    return { isValid: false, error: "Descripción de receta requerida" };
  }

  if (!recipeData.instructions || typeof recipeData.instructions !== "string") {
    return { isValid: false, error: "Instrucciones de receta requeridas" };
  }

  return { isValid: true };
}
