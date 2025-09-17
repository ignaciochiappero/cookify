import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/recipes - Obtener recetas del usuario
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const ingredients = searchParams.get('ingredients')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';

    // Construir filtros
    const whereClause: {
      userId: string;
      title?: { contains: string; mode: 'insensitive' };
      ingredients?: { contains: string };
    } = {
      userId: session.user.id
    };

    // Filtro por búsqueda de nombre
    if (search) {
      whereClause.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filtro por ingredientes
    if (ingredients.length > 0) {
      whereClause.ingredients = {
        contains: ingredients[0] // Buscar al menos el primer ingrediente
      };
      
      // Si hay múltiples ingredientes, buscar que contenga todos
      for (let i = 1; i < ingredients.length; i++) {
        whereClause.ingredients = {
          ...whereClause.ingredients,
          contains: ingredients[i]
        };
      }
    }

    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Filtrar recetas que contengan TODOS los ingredientes especificados
    const filteredRecipes = recipes.filter(recipe => {
      if (ingredients.length === 0) return true;
      
      try {
        const recipeIngredients = JSON.parse(recipe.ingredients);
        const recipeIngredientNames = recipeIngredients.map((ing: { name?: string }) => 
          ing.name?.toLowerCase() || ''
        );
        
        return ingredients.every(ingredient => 
          recipeIngredientNames.some((name: string) => 
            name.includes(ingredient.toLowerCase())
          )
        );
      } catch {
        // Si no se puede parsear, buscar en el string directamente
        return ingredients.every(ingredient => 
          recipe.ingredients.toLowerCase().includes(ingredient.toLowerCase())
        );
      }
    });

    const total = await prisma.recipe.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      data: filteredRecipes,
      pagination: {
        total: total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
