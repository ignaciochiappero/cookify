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

    // Obtener TODOS los usuarios sin filtros
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        userPreferences: {
          select: {
            healthConditions: true,
            customHealthConditions: true,
            personalGoals: true,
            customPersonalGoals: true,
            country: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log("🔍 DEBUG: Total de usuarios en BD:", allUsers.length);
    console.log("🔍 DEBUG: Usuarios encontrados:", allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hasPreferences: !!u.userPreferences
    })));

    // Filtrar solo usuarios que no sean el actual
    const otherUsers = allUsers.filter(user => user.id !== session.user.id);
    
    console.log("🔍 DEBUG: Otros usuarios (excluyendo actual):", otherUsers.length);

    return NextResponse.json({
      totalUsers: allUsers.length,
      otherUsers: otherUsers.length,
      currentUserId: session.user.id,
      users: otherUsers
    });

  } catch (error) {
    console.error("Error en debug de usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
