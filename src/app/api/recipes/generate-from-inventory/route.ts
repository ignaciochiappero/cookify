import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRecipeWithInventory } from '@/lib/gemini';

// POST - Generar receta basada en inventario disponible
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mealType, servings, suggestIngredients, customTitle, customDescription, preferredIngredients } = body;

    // Obtener inventario del usuario
    const inventory = await prisma.userIngredientInventory.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        food: true
      }
    });

    if (inventory.length === 0) {
      return NextResponse.json(
        { error: 'No tienes ingredientes en tu inventario' },
        { status: 400 }
      );
    }

    console.log(`Generando receta para ${mealType} con ${inventory.length} ingredientes en inventario`);

    // Formatear ingredientes con cantidades
    const ingredientsWithQuantities = inventory.map(item => ({
      name: item.food.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.food.category
    }));

    // Generar receta usando Gemini con inventario
    const recipeData = await generateRecipeWithInventory(
      ingredientsWithQuantities,
      mealType,
      servings,
      suggestIngredients,
      {
        customTitle,
        customDescription,
        preferredIngredients
      }
    );

    // Guardar receta en la base de datos
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        description: recipeData.description,
        ingredients: JSON.stringify(ingredientsWithQuantities),
        instructions: recipeData.instructions,
        cookingTime: recipeData.cookingTime,
        difficulty: recipeData.difficulty,
        servings: servings || recipeData.servings,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      recipe,
      suggestedIngredients: recipeData.suggestedIngredients || []
    });
  } catch (error) {
    console.error('Error al generar receta desde inventario:', error);
    
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
