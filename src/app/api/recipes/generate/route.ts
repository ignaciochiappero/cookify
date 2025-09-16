import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRecipe } from '@/lib/gemini';
import { RecipeGenerationRequest } from '@/types/recipe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      );
    }

    const body: RecipeGenerationRequest = await request.json();
    const { ingredients, preferences } = body;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requieren ingredientes para generar la receta'
        },
        { status: 400 }
      );
    }

    // Generar receta con Gemini
    const generatedRecipe = await generateRecipe(ingredients, preferences);

    // Guardar receta en la base de datos
    const savedRecipe = await prisma.recipe.create({
      data: {
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        ingredients: JSON.stringify(ingredients),
        instructions: generatedRecipe.instructions,
        cookingTime: generatedRecipe.cookingTime,
        difficulty: generatedRecipe.difficulty,
        servings: generatedRecipe.servings,
        userId: session.user.id
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: savedRecipe,
        message: 'Receta generada exitosamente'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al generar receta:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
