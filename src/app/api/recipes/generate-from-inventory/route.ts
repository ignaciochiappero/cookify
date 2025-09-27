import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRecipeWithInventory } from "@/lib/gemini";
import {
  verifyAuthentication,
  createRecipe,
  handleRecipeError,
  formatInventoryIngredients,
} from "@/lib/recipeService";

// POST - Generar receta basada en inventario disponible
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando función centralizada
    const authResult = await verifyAuthentication();
    if (!authResult.success) {
      return authResult.error!;
    }

    const body = await request.json();
    const {
      mealType,
      servings,
      suggestIngredients,
      customTitle,
      customDescription,
      preferredIngredients,
    } = body;

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
        ingredientsWithQuantities,
        mealType,
        servings,
        suggestIngredients,
        {
          customTitle,
          customDescription,
          preferredIngredients,
        }
      );

      // Crear receta usando función centralizada
      const recipeResult = await createRecipe(recipeData, {
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
    ]);

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
