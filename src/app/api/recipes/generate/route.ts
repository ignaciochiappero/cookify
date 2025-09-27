import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/gemini";
import { RecipeGenerationRequest } from "@/types/recipe";
import {
  verifyAuthentication,
  createRecipe,
  handleRecipeError,
} from "@/lib/recipeService";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando función centralizada
    const authResult = await verifyAuthentication();
    if (!authResult.success) {
      return authResult.error!;
    }

    const body: RecipeGenerationRequest = await request.json();
    const { ingredients, preferences } = body;

    // Validar datos de entrada
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requieren ingredientes para generar la receta",
        },
        { status: 400 }
      );
    }

    // Timeout más largo para generación de recetas (5 minutos)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error("Timeout: La generación de receta tardó más de 5 minutos")
          ),
        300000
      );
    });

    const generationPromise = (async () => {
      // Generar receta con IA
      const generatedRecipe = await generateRecipe(ingredients, preferences);

      // Asegurar que cookingTime tenga un valor por defecto
      const recipeDataWithDefaults = {
        ...generatedRecipe,
        cookingTime: generatedRecipe.cookingTime || 30, // 30 minutos por defecto
        difficulty: generatedRecipe.difficulty || 'Fácil',
        servings: generatedRecipe.servings || 4,
      };

      // Crear receta usando función centralizada
      const recipeResult = await createRecipe(recipeDataWithDefaults, {
        ingredients,
        userId: authResult.userId!,
      });

      return recipeResult;
    })();

    const recipeResult = await Promise.race([
      generationPromise,
      timeoutPromise,
    ]) as {
      success: boolean;
      recipe?: unknown;
      error?: string;
      details?: string;
    };

    if (!recipeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: recipeResult.error,
          details: recipeResult.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: recipeResult.recipe,
        message: "Receta generada exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRecipeError(error, "generación de receta");
  }
}
