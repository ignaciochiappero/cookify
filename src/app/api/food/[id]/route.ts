import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

// PUT /api/food/[id] - Actualizar un ingrediente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, image, icon, category, unit } = body;

    // Verificar sesión y autorización
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      );
    }

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

    // Verificar que el ingrediente existe y pertenece al usuario
    const existingFood = await prisma.food.findFirst({
      where: { 
        id,
        userId: session.user.id // Solo ingredientes del usuario
      }
    });

    if (!existingFood) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ingrediente no encontrado o no tienes permisos para editarlo'
        },
        { status: 404 }
      );
    }

    // Verificar si ya existe otro ingrediente con el mismo nombre para este usuario
    if (name.trim() !== existingFood.name) {
      const duplicateFood = await prisma.food.findFirst({
        where: {
          name: name.trim(),
          userId: session.user.id,
          id: { not: id }
        }
      });

      if (duplicateFood) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ya tienes un ingrediente con este nombre'
          },
          { status: 400 }
        );
      }
    }

    // Actualizar el ingrediente
    const updatedFood = await prisma.food.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        image: image || existingFood.image,
        icon: icon !== undefined ? icon : existingFood.icon,
        category: category || existingFood.category,
        unit: unit || existingFood.unit
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedFood,
        message: 'Ingrediente actualizado exitosamente'
      }
    );
  } catch (error) {
    console.error('Error al actualizar ingrediente:', error);
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

    // Verificar sesión y autorización
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado'
        },
        { status: 401 }
      );
    }

    // Verificar que la verdura existe y pertenece al usuario
    const existingFood = await prisma.food.findFirst({
      where: { 
        id,
        userId: session.user.id // Solo ingredientes del usuario
      }
    });

    if (!existingFood) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verdura no encontrada o no tienes permisos para eliminarla'
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
