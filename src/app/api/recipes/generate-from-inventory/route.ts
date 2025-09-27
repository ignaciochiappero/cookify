import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRecipeWithInventory } from "@/lib/gemini";
// InventoryIngredient está definido en gemini.ts
import {
  verifyAuthentication,
  createRecipe,
  handleRecipeError,
  formatInventoryIngredients,
} from "@/lib/recipeService";

// POST - Generar receta basada en inventario disponible
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 DEBUG: Recibida solicitud de generación de receta desde inventario");
    
    // Verificar autenticación usando función centralizada
    const authResult = await verifyAuthentication();
    if (!authResult.success) {
      console.error("❌ DEBUG: Error de autenticación:", authResult.error);
      return authResult.error!;
    }

    const body = await request.json();
    console.log("🔍 DEBUG: Body recibido:", body);
    
    const {
      mealType,
      servings,
      suggestIngredients,
      customTitle,
      customDescription,
      preferredIngredients,
    } = body;

    console.log("🔍 DEBUG: Parámetros extraídos:", {
      mealType,
      servings,
      suggestIngredients,
      customTitle,
      customDescription,
      preferredIngredients,
    });

    // Obtener inventario del usuario
    const inventory = await prisma.userIngredientInventory.findMany({
      where: {
        userId: authResult.userId!,
      },
      include: {
        food: true,
      },
    });

    if (inventory.length === 0) {
      return NextResponse.json(
        { error: "No tienes ingredientes en tu inventario" },
        { status: 400 }
      );
    }

    console.log(
      `Generando receta para ${mealType} con ${inventory.length} ingredientes en inventario`
    );

    // Formatear ingredientes usando función centralizada
    const ingredientsWithQuantities = formatInventoryIngredients(inventory);

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
      // Generar receta usando IA con inventario
      const recipeData = await generateRecipeWithInventory(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ingredientsWithQuantities as any,
        mealType,
        servings,
        suggestIngredients,
        {
          customTitle,
          customDescription,
          preferredIngredients,
        }
      );

      // Asegurar que cookingTime tenga un valor por defecto
      const recipeDataWithDefaults = {
        ...recipeData,
        cookingTime: recipeData.cookingTime || 30, // 30 minutos por defecto
        difficulty: recipeData.difficulty || 'Fácil',
        servings: recipeData.servings || servings || 4,
      };

      // Crear receta usando función centralizada
      const recipeResult = await createRecipe(recipeDataWithDefaults, {
        ingredients: ingredientsWithQuantities,
        userId: authResult.userId!,
        customTitle,
        customDescription,
        customServings: servings,
      });

      return { recipeResult, recipeData };
    })();

    const { recipeResult, recipeData } = await Promise.race([
      generationPromise,
      timeoutPromise,
    ]) as {
      recipeResult: {
        success: boolean;
        recipe?: unknown;
        error?: string;
        details?: string;
      };
      recipeData: {
        suggestedIngredients?: string[];
      };
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

    return NextResponse.json({
      success: true,
      recipe: recipeResult.recipe,
      suggestedIngredients: recipeData.suggestedIngredients || [],
    });
  } catch (error) {
    return handleRecipeError(error, "generación de receta desde inventario");
  }
}
