import { NextRequest, NextResponse } from "next/server";
import { generateRecipe } from "@/lib/gemini";
import { getCachedRecipe, setCachedRecipe } from "@/lib/recipeCache";
import {
  verifyAuthentication,
  createRecipe,
  handleRecipeError,
  formatSpecificIngredients,
} from "@/lib/recipeService";

// POST - Generar receta específica con ingredientes determinados
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando función centralizada
    const authResult = await verifyAuthentication();
    if (!authResult.success) {
      return authResult.error!;
    }

    const body = await request.json();
    const {
      title,
      description,
      mealType,
      servings,
      difficulty,
      cookingTime,
      specificIngredients,
      preferences,
    } = body;

    console.log(
      `Generando receta específica: ${title} con ingredientes:`,
      specificIngredients
    );

    // Verificar cache primero
    const cachedRecipe = getCachedRecipe(specificIngredients);
    if (cachedRecipe) {
      console.log("✅ Usando receta del cache");
      return NextResponse.json({
        success: true,
        recipe: cachedRecipe,
        fromCache: true,
      });
    }

    // Formatear ingredientes usando función centralizada
    const recipeIngredients = formatSpecificIngredients(specificIngredients);

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
      // Generar receta usando IA con ingredientes específicos
      const recipeData = await generateRecipe(recipeIngredients, {
        cookingTime: cookingTime || 30,
        difficulty: difficulty || "Fácil",
        servings: servings || 4,
        dietaryRestrictions: preferences?.dietaryRestrictions || [],
      });

      // Crear receta usando función centralizada
      const recipeResult = await createRecipe(recipeData, {
        ingredients: specificIngredients,
        userId: authResult.userId!,
        customTitle: title,
        customDescription: description,
        customServings: servings,
        customCookingTime: cookingTime,
        customDifficulty: difficulty,
      });

      return recipeResult;
    })();

    const recipeResult = await Promise.race([
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

    // Guardar en cache para futuras consultas
    setCachedRecipe(specificIngredients, recipeResult.recipe);

    return NextResponse.json({
      success: true,
      recipe: recipeResult.recipe,
      fromCache: false,
    });
  } catch (error) {
    return handleRecipeError(error, "generación de receta específica");
  }
}
