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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const healthCondition = searchParams.get('healthCondition') || '';
    const personalGoal = searchParams.get('personalGoal') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Construir filtros base - MÁS PERMISIVO
    const where: Record<string, unknown> = {
      id: { not: session.user.id }, // Excluir al usuario actual
      // NO filtrar por role para traer todos los usuarios
    };

    // Filtro por nombre o email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // TEMPORAL: Deshabilitar filtros de preferencias para debug
    // TODO: Rehabilitar cuando funcione la búsqueda básica
    console.log("🔍 DEBUG: Filtros de preferencias deshabilitados temporalmente");

    console.log("🔍 DEBUG: Filtros aplicados:", JSON.stringify(where, null, 2));
    console.log("🔍 DEBUG: Parámetros de búsqueda:", { search, country, healthCondition, personalGoal, page, limit });

    // Obtener usuarios con sus preferencias
    const users = await prisma.user.findMany({
      where,
      include: {
        userPreferences: true,
        _count: {
          select: {
            friendships1: true,
            friendships2: true,
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    console.log("🔍 DEBUG: Usuarios encontrados:", users.length);
    console.log("🔍 DEBUG: Primeros usuarios:", users.slice(0, 3).map(u => ({ id: u.id, name: u.name, email: u.email })));

    // Obtener información de amistad para cada usuario
    const usersWithFriendshipInfo = await Promise.all(
      users.map(async (user) => {
        // Verificar si ya son amigos
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { user1Id: session.user.id, user2Id: user.id },
              { user1Id: user.id, user2Id: session.user.id }
            ]
          }
        });

        // Verificar si hay solicitud pendiente
        const friendRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: user.id },
              { senderId: user.id, receiverId: session.user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          userPreferences: user.userPreferences,
          isFriend: !!friendship,
          friendRequestStatus: friendRequest?.status || 'NONE',
          friendCount: (user._count.friendships1 + user._count.friendships2)
        };
      })
    );

    // Obtener total para paginación
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users: usersWithFriendshipInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error buscando usuarios:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
