import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRecipe } from '@/lib/gemini';
import { getCachedRecipe, setCachedRecipe } from '@/lib/recipeCache';

// POST - Generar receta específica con ingredientes determinados
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
      preferences 
    } = body;

    console.log(`Generando receta específica: ${title} con ingredientes:`, specificIngredients);

    // Verificar cache primero
    const cachedRecipe = getCachedRecipe(specificIngredients);
    if (cachedRecipe) {
      console.log('✅ Usando receta del cache');
      return NextResponse.json({
        recipe: cachedRecipe,
        success: true,
        fromCache: true
      });
    }

    // Convertir ingredientes específicos al formato esperado por generateRecipe
    const recipeIngredients = specificIngredients.map((ingredient: string) => ({
      name: ingredient,
      quantity: 1, // Cantidad por defecto, Gemini calculará las cantidades exactas
      unit: 'PIECE' as const
    }));

    // Generar receta usando Gemini con ingredientes específicos
    const recipeData = await generateRecipe(
      recipeIngredients,
      {
        cookingTime: cookingTime || 30,
        difficulty: difficulty || 'Fácil',
        servings: servings || 4,
        dietaryRestrictions: preferences?.dietaryRestrictions || []
      }
    );

    // Guardar receta en la base de datos
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        description: recipeData.description,
        ingredients: JSON.stringify(specificIngredients || []),
        instructions: recipeData.instructions,
        cookingTime: recipeData.cookingTime,
        difficulty: recipeData.difficulty,
        servings: servings || recipeData.servings,
        userId: session.user.id
      }
    });

    // Guardar en cache para futuras consultas
    setCachedRecipe(specificIngredients, recipe);

    return NextResponse.json({
      recipe,
      success: true,
      fromCache: false
    });
  } catch (error) {
    console.error('Error al generar receta específica:', error);
    
    // Log más detallado del error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
