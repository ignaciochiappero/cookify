import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/food/[id] - Obtener una verdura específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const food = await prisma.food.findUnique({
      where: { id }
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

    return NextResponse.json({
      success: true,
      data: food
    });
  } catch (error) {
    console.error('Error al obtener verdura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// PUT /api/food/[id] - Actualizar una verdura
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, image } = body;

    // Validaciones básicas
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre y descripción son requeridos'
        },
        { status: 400 }
      );
    }

    // Verificar que la verdura existe
    const existingFood = await prisma.food.findUnique({
      where: { id }
    });

    if (!existingFood) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verdura no encontrada'
        },
        { status: 404 }
      );
    }

    // Actualizar la verdura
    const updatedFood = await prisma.food.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        image: image || existingFood.image
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedFood,
        message: 'Verdura actualizada exitosamente'
      }
    );
  } catch (error) {
    console.error('Error al actualizar verdura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/food/[id] - Eliminar una verdura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la verdura existe
    const existingFood = await prisma.food.findUnique({
      where: { id }
    });

    if (!existingFood) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verdura no encontrada'
        },
        { status: 404 }
      );
    }

    // Eliminar la verdura
    await prisma.food.delete({
      where: { id }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Verdura eliminada exitosamente'
      }
    );
  } catch (error) {
    console.error('Error al eliminar verdura:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
