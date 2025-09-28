import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id }
    });

    console.log("🔍 DEBUG: Preferencias encontradas:", preferences);
    console.log("🔍 DEBUG: Health conditions en DB:", preferences?.healthConditions);
    console.log("🔍 DEBUG: Custom health conditions en DB:", preferences?.customHealthConditions);

    if (!preferences) {
      return NextResponse.json({ error: "Preferencias no encontradas" }, { status: 404 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Datos recibidos:", body);
    
    const {
      healthConditions,
      customHealthConditions,
      personalGoals,
      customPersonalGoals,
      cookingSkill,
      cookingTime,
      servings,
      country,
      locationEnabled
    } = body;

    // Validar datos
    if (!cookingSkill || !cookingTime || !servings) {
      return NextResponse.json(
        { error: "Datos requeridos faltantes" },
        { status: 400 }
      );
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        healthConditions: healthConditions || [],
        customHealthConditions: customHealthConditions || [],
        personalGoals: personalGoals || [],
        customPersonalGoals: customPersonalGoals || [],
        cookingSkill,
        cookingTime,
        servings,
        country: country || null,
        locationEnabled: locationEnabled || false,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        healthConditions: healthConditions || [],
        customHealthConditions: customHealthConditions || [],
        personalGoals: personalGoals || [],
        customPersonalGoals: customPersonalGoals || [],
        cookingSkill,
        cookingTime,
        servings,
        country: country || null,
        locationEnabled: locationEnabled || false
      }
    });

    console.log("Preferencias guardadas:", preferences);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}