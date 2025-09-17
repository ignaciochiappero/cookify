import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateInventoryItem } from '@/types/inventory';

// GET - Obtener inventario del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const inventory = await prisma.userIngredientInventory.findMany({
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
      data: inventory
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo item en inventario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateInventoryItem = await request.json();
    const { foodId, quantity, unit, expirationDate, notes } = body;

    // Verificar si ya existe un item para este ingrediente
    const existingItem = await prisma.userIngredientInventory.findUnique({
      where: {
        userId_foodId: {
          userId: session.user.id,
          foodId: foodId
        }
      }
    });

    if (existingItem) {
      // Actualizar cantidad existente
      const updatedItem = await prisma.userIngredientInventory.update({
        where: {
          id: existingItem.id
        },
        data: {
          quantity: existingItem.quantity + quantity,
          unit,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          notes: notes || existingItem.notes
        },
        include: {
          food: true
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedItem
      });
    } else {
      // Crear nuevo item
      const newItem = await prisma.userIngredientInventory.create({
        data: {
          userId: session.user.id,
          foodId,
          quantity,
          unit,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          notes
        },
        include: {
          food: true
        }
      });

      return NextResponse.json({
        success: true,
        data: newItem
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error al crear item en inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
