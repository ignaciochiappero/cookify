import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Responder a invitación de evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' o 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: "Acción inválida" },
        { status: 400 }
      );
    }

    // Buscar la participación del usuario en el evento
    const { id } = await params;
    const participation = await prisma.eventParticipant.findFirst({
      where: {
        eventId: id,
        userId: session.user.id
      },
      include: {
        event: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!participation) {
      return NextResponse.json(
        { error: "No estás invitado a este evento" },
        { status: 404 }
      );
    }

    // Actualizar el estado de participación
    const updatedParticipation = await prisma.eventParticipant.update({
      where: { id: participation.id },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        joinedAt: action === 'accept' ? new Date() : null
      }
    });

    // Crear notificación para el creador del evento
    await prisma.notification.create({
      data: {
        userId: participation.event.creatorId,
        type: action === 'accept' ? 'EVENT_INVITATION' : 'EVENT_CANCELLED',
        title: action === 'accept' ? 'Participante confirmado' : 'Participante declinó',
        message: `${session.user.name || session.user.email} ${action === 'accept' ? 'aceptó' : 'declinó'} la invitación al evento "${participation.event.title}"`,
        relatedId: participation.event.id
      }
    });

    return NextResponse.json(updatedParticipation);

  } catch (error) {
    console.error("Error respondiendo a evento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
