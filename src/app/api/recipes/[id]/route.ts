import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener receta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const recipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: recipe
    });

  } catch (error) {
    console.error('Error al obtener receta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar receta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, ingredients, instructions, cookingTime, difficulty, servings } = body;

    // Verificar que la receta pertenece al usuario
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    }

    // Actualizar la receta
    const updatedRecipe = await prisma.recipe.update({
      where: { id: id },
      data: {
        title: title || existingRecipe.title,
        description: description || existingRecipe.description,
        ingredients: ingredients || existingRecipe.ingredients,
        instructions: instructions || existingRecipe.instructions,
        cookingTime: cookingTime || existingRecipe.cookingTime,
        difficulty: difficulty || existingRecipe.difficulty,
        servings: servings || existingRecipe.servings,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRecipe
    });

  } catch (error) {
    console.error('Error al actualizar receta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar receta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la receta pertenece al usuario
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    }

    // Eliminar entradas del calendario que usan esta receta
    await prisma.mealCalendar.deleteMany({
      where: {
        recipeId: id
      }
    });

    // Eliminar la receta
    await prisma.recipe.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar receta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
