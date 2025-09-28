import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener solicitudes de amistad
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'sent' o 'received'

    const where = type === 'sent' 
      ? { senderId: session.user.id }
      : { receiverId: session.user.id };

    const friendRequests = await prisma.friendRequest.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(friendRequests);

  } catch (error) {
    console.error("Error obteniendo solicitudes de amistad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Enviar solicitud de amistad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { receiverId, message } = await request.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "ID del receptor requerido" },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes enviarte una solicitud a ti mismo" },
        { status: 400 }
      );
    }

    // Verificar si ya son amigos
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: receiverId },
          { user1Id: receiverId, user2Id: session.user.id }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: "Ya son amigos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.user.id }
        ],
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Ya existe una solicitud pendiente" },
        { status: 400 }
      );
    }

    // Crear solicitud de amistad
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverId,
        message: message || null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Crear notificación para el receptor
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        title: 'Nueva solicitud de amistad',
        message: `${session.user.name || session.user.email} quiere ser tu amigo`,
        relatedId: friendRequest.id
      }
    });

    return NextResponse.json(friendRequest);

  } catch (error) {
    console.error("Error enviando solicitud de amistad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
