import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateInventoryItem } from '@/types/inventory';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener item específico del inventario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.userIngredientInventory.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        food: true
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error al obtener item del inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar item del inventario
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateInventoryItem = await request.json();

    const updatedItem = await prisma.userIngredientInventory.updateMany({
      where: {
        id: id,
        userId: session.user.id
      },
      data: {
        ...body,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined
      }
    });

    if (updatedItem.count === 0) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const item = await prisma.userIngredientInventory.findUnique({
      where: { id },
      include: {
        food: true
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error al actualizar item del inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar item del inventario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const deletedItem = await prisma.userIngredientInventory.deleteMany({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (deletedItem.count === 0) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar item del inventario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
