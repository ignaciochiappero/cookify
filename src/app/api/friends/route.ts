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

    // Obtener todas las amistades del usuario
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userPreferences: {
              select: {
                healthConditions: true,
                customHealthConditions: true,
                personalGoals: true,
                customPersonalGoals: true,
                country: true
              }
            }
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userPreferences: {
              select: {
                healthConditions: true,
                customHealthConditions: true,
                personalGoals: true,
                customPersonalGoals: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatear los amigos (excluir al usuario actual)
    const friends = friendships.map(friendship => {
      const friend = friendship.user1Id === session.user.id 
        ? friendship.user2 
        : friendship.user1;
      
      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        image: friend.image,
        userPreferences: friend.userPreferences,
        friendshipDate: friendship.createdAt
      };
    });

    return NextResponse.json(friends);

  } catch (error) {
    console.error("Error obteniendo amigos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
