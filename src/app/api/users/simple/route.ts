import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("🔍 DEBUG: Usuario actual:", session.user.id);

    // Búsqueda MUY simple - solo excluir al usuario actual
    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        userPreferences: {
          select: {
            healthConditions: true,
            customHealthConditions: true,
            personalGoals: true,
            customPersonalGoals: true,
            country: true,
            cookingSkill: true,
            cookingTime: true,
            servings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log("🔍 DEBUG: Usuarios encontrados:", users.length);
    console.log("🔍 DEBUG: Primeros usuarios:", users.slice(0, 3).map(u => ({ id: u.id, name: u.name, email: u.email })));

    // Formatear respuesta simple
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      userPreferences: user.userPreferences,
      isFriend: false, // Por ahora siempre false
      friendRequestStatus: 'NONE' as const,
      friendCount: 0
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page: 1,
        limit: 20,
        total: users.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error("Error en búsqueda simple de usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
