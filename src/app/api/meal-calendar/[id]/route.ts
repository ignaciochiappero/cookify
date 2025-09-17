import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateMealCalendarItem } from '@/types/meal-calendar';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener entrada específica del calendario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const meal = await prisma.mealCalendar.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        recipe: true
      }
    });

    if (!meal) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Error al obtener comida del calendario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar entrada del calendario
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateMealCalendarItem = await request.json();

    const updatedMeal = await prisma.mealCalendar.updateMany({
      where: {
        id: id,
        userId: session.user.id
      },
      data: body
    });

    if (updatedMeal.count === 0) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    const meal = await prisma.mealCalendar.findUnique({
      where: { id },
      include: {
        recipe: true
      }
    });

    return NextResponse.json(meal);
  } catch (error) {
    console.error('Error al actualizar comida del calendario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar entrada del calendario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const deletedMeal = await prisma.mealCalendar.deleteMany({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (deletedMeal.count === 0) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Comida eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar comida del calendario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
