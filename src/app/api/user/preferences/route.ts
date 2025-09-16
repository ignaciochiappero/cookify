import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/user/preferences - Obtener preferencias del usuario
export async function GET() {
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

    const preferences = await prisma.userFoodPreference.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        food: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error al obtener preferencias:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// POST /api/user/preferences - Crear o actualizar preferencia
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

    const body = await request.json();
    const { foodId, isAvailable } = body;

    if (!foodId || typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'foodId e isAvailable son requeridos'
        },
        { status: 400 }
      );
    }

    // Verificar que la verdura existe
    const food = await prisma.food.findUnique({
      where: { id: foodId }
    });

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verdura no encontrada'
        },
        { status: 404 }
      );
    }

    // Crear o actualizar preferencia
    const preference = await prisma.userFoodPreference.upsert({
      where: {
        userId_foodId: {
          userId: session.user.id,
          foodId: foodId
        }
      },
      update: {
        isAvailable
      },
      create: {
        userId: session.user.id,
        foodId: foodId,
        isAvailable
      },
      include: {
        food: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: preference,
        message: 'Preferencia actualizada exitosamente'
      }
    );
  } catch (error) {
    console.error('Error al actualizar preferencia:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
