import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🗑️ DEBUG: Iniciando eliminación masiva de ingredientes del usuario...');

    // Eliminar solo los ingredientes del usuario actual usando una transacción
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Primero eliminar todas las referencias en inventario del usuario
      const deletedInventory = await tx.userIngredientInventory.deleteMany({
        where: { userId: session.user.id }
      });
      console.log(`🗑️ DEBUG: Eliminados ${deletedInventory.count} elementos del inventario del usuario`);

      // Luego eliminar solo los ingredientes del usuario
      const deletedFoods = await tx.food.deleteMany({
        where: { userId: session.user.id }
      });
      console.log(`🗑️ DEBUG: Eliminados ${deletedFoods.count} ingredientes del usuario`);

      return {
        deletedFoods: deletedFoods.count,
        deletedInventory: deletedInventory.count
      };
    });

    console.log('✅ DEBUG: Eliminación masiva completada:', result);

    return NextResponse.json({
      success: true,
      message: 'Todos los ingredientes han sido eliminados exitosamente',
      data: result
    });

  } catch (error) {
    console.error('❌ DEBUG: Error eliminando todos los ingredientes:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al eliminar ingredientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
