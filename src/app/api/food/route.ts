import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/food - Obtener todas las verduras
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
        },
        { status: 401 }
      );
    }
    const foods = await prisma.food.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: foods,
      count: foods.length,
    });
  } catch (error) {
    console.error("Error al obtener verduras:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// POST /api/food - Crear un nuevo ingrediente
export async function POST(request: NextRequest) {
  try {
    // Verificar sesión y autorización
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "No autorizado",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, image, icon, category, unit } = body;

    // Validaciones básicas
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Nombre y descripción son requeridos",
        },
        { status: 400 }
      );
    }

    // Crear el nuevo ingrediente
    const newFood = await prisma.food.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        image:
          image ||
          "https://images.unsplash.com/photo-1546470427-5c1d2b0b8b8b?w=400",
        icon: icon || null,
        category: category || "VEGETABLE",
        unit: unit || "PIECE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newFood,
        message: "Ingrediente creado exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear ingrediente:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
