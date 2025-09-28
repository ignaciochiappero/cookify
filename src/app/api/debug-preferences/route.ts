import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("🔍 DEBUG: User ID:", session.user.id);

    // Obtener preferencias del usuario
    const userPreferences = await prisma.userPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    console.log("🔍 DEBUG: Preferencias encontradas:", userPreferences);
    console.log("🔍 DEBUG: Health conditions:", userPreferences?.healthConditions);
    console.log("🔍 DEBUG: Custom health conditions:", userPreferences?.customHealthConditions);

    // Obtener todas las preferencias para debug
    const allPreferences = await prisma.userPreferences.findMany();
    console.log("🔍 DEBUG: Todas las preferencias en la DB:", allPreferences);

    return NextResponse.json({
      userPreferences,
      allPreferences,
      userId: session.user.id
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
