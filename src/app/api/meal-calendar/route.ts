import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateMealCalendarItem, MealType } from '@/types/meal-calendar';

// GET - Obtener calendario de comidas del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: {
      userId: string;
      date?: {
        gte: Date;
        lte: Date;
      };
    } = {
      userId: session.user.id
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const meals = await prisma.mealCalendar.findMany({
      where: whereClause,
      include: {
        recipe: true
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' }
      ]
    });

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error al obtener calendario de comidas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva entrada en calendario de comidas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateMealCalendarItem = await request.json();
    const { date, mealType, recipeId, customMealName, notes } = body;

    // Verificar si ya existe una entrada para esta fecha y tipo de comida
    const existingMeal = await prisma.mealCalendar.findUnique({
      where: {
        userId_date_mealType: {
          userId: session.user.id,
          date: new Date(date),
          mealType: mealType as MealType
        }
      }
    });

    if (existingMeal) {
      return NextResponse.json(
        { error: 'Ya existe una comida planificada para esta fecha y hora' },
        { status: 400 }
      );
    }

    const newMeal = await prisma.mealCalendar.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        mealType: mealType as MealType,
        recipeId: recipeId || null,
        customMealName: customMealName || null,
        notes: notes || null,
        isPlanned: true
      },
      include: {
        recipe: true
      }
    });

    return NextResponse.json(newMeal, { status: 201 });
  } catch (error) {
    console.error('Error al crear entrada en calendario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
