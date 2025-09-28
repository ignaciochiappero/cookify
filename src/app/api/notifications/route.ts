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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: session.user.id
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Obtener conteo de notificaciones no leídas
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    // Obtener conteo por tipo
    const countsByType = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        userId: session.user.id,
        isRead: false
      },
      _count: {
        type: true
      }
    });

    const byType = {
      friendRequests: 0,
      eventInvitations: 0,
      other: 0
    };

    countsByType.forEach(count => {
      if (count.type === 'FRIEND_REQUEST') {
        byType.friendRequests = count._count.type;
      } else if (count.type === 'EVENT_INVITATION') {
        byType.eventInvitations = count._count.type;
      } else {
        byType.other += count._count.type;
      }
    });

    return NextResponse.json({
      notifications,
      counts: {
        total: notifications.length,
        unread: unreadCount,
        byType
      }
    });

  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Marcar notificaciones como leídas
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Marcar todas las notificaciones como leídas
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marcar notificaciones específicas como leídas
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id
        },
        data: {
          isRead: true
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error marcando notificaciones como leídas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
