import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🚀 DEBUG: Iniciando eliminación masiva de recetas...');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar todas las entradas del calendario de comidas que referencian recetas
      const deletedCalendarEntries = await tx.mealCalendar.deleteMany({});
      console.log(`✅ DEBUG: ${deletedCalendarEntries.count} entradas del calendario eliminadas.`);

      // 2. Eliminar todas las recetas
      const deletedRecipes = await tx.recipe.deleteMany({});
      console.log(`✅ DEBUG: ${deletedRecipes.count} recetas eliminadas.`);

      return { 
        deletedRecipes: deletedRecipes.count, 
        deletedCalendarEntries: deletedCalendarEntries.count 
      };
    });

    console.log('✅ DEBUG: Eliminación masiva completada:', result);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ DEBUG: Error en la eliminación masiva de recetas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar todas las recetas' },
      { status: 500 }
    );
  }
}
