import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Responder a solicitud de amistad
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

    // Obtener la solicitud
    const { id } = await params;
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario actual es el receptor
    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para responder esta solicitud" },
        { status: 403 }
      );
    }

    // Verificar que la solicitud esté pendiente
    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: "La solicitud ya fue respondida" },
        { status: 400 }
      );
    }

    // Actualizar el estado de la solicitud
    const updatedRequest = await prisma.friendRequest.update({
      where: { id },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED'
      }
    });

    // Si se acepta, crear la amistad
    if (action === 'accept') {
      await prisma.friendship.create({
        data: {
          user1Id: friendRequest.senderId,
          user2Id: friendRequest.receiverId
        }
      });

      // Crear notificación para el remitente
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: 'FRIEND_REQUEST_ACCEPTED',
          title: 'Solicitud de amistad aceptada',
          message: `${session.user.name || session.user.email} aceptó tu solicitud de amistad`,
          relatedId: friendRequest.id
        }
      });
    }

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error("Error respondiendo solicitud de amistad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar solicitud de amistad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la solicitud
    const { id } = await params;
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id }
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario actual es el remitente
    if (friendRequest.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para cancelar esta solicitud" },
        { status: 403 }
      );
    }

    // Eliminar la solicitud
    await prisma.friendRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error cancelando solicitud de amistad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
