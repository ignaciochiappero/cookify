import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { inventory, days, startDate } = await request.json();

    if (!inventory || !days || !startDate) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const mealPlan = await generateMealPlan(inventory, days, new Date(startDate));

    return NextResponse.json({ mealPlan });

  } catch (error) {
    console.error('Error generando plan de comidas:', error);
    return NextResponse.json(
      { error: 'Error al generar el plan de comidas' },
      { status: 500 }
    );
  }
}
