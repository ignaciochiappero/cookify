import { NextRequest, NextResponse } from 'next/server';
import { generateMealPlan } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { inventory, days, startDate } = await request.json();

    console.log("🚀 DEBUG: Recibida solicitud de plan de comidas:", {
      inventory: inventory?.length || 0,
      days,
      startDate,
    });

    if (!inventory || !days || !startDate) {
      console.error("❌ DEBUG: Faltan parámetros requeridos");
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    console.log("🔍 DEBUG: Llamando a generateMealPlan con:", {
      inventoryLength: inventory.length,
      days,
      startDate: new Date(startDate),
    });

    const mealPlan = await generateMealPlan(inventory, days, new Date(startDate));

    console.log("✅ DEBUG: Plan de comidas generado:", {
      mealPlanLength: mealPlan?.length || 0,
      mealPlan: mealPlan,
    });

    return NextResponse.json({ mealPlan });

  } catch (error) {
    console.error('❌ DEBUG: Error generando plan de comidas:', error);
    return NextResponse.json(
      { error: 'Error al generar el plan de comidas' },
      { status: 500 }
    );
  }
}
