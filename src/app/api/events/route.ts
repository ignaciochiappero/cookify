import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateEventData } from "@/types/event";

// GET - Obtener eventos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'created', 'participating'

    const where: Record<string, unknown> = {};

    if (type === 'created') {
      where.creatorId = session.user.id;
    } else if (type === 'participating') {
      where.participants = {
        some: {
          userId: session.user.id,
          status: { in: ['INVITED', 'ACCEPTED'] }
        }
      };
    } else {
      where.OR = [
        { creatorId: session.user.id },
        {
          participants: {
            some: {
              userId: session.user.id,
              status: { in: ['INVITED', 'ACCEPTED'] }
            }
          }
        }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        recipe: {
          select: {
            id: true,
            title: true,
            description: true,
            ingredients: true,
            instructions: true,
            cookingTime: true,
            difficulty: true,
            servings: true,
            healthConditions: true,
            customHealthConditions: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(events);

  } catch (error) {
    console.error("Error obteniendo eventos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const eventData: CreateEventData = await request.json();

    // Validar datos requeridos
    if (!eventData.title || !eventData.date || !eventData.mealType || !eventData.participantIds.length) {
      return NextResponse.json(
        { error: "Datos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Crear el evento
    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: new Date(eventData.date),
        mealType: eventData.mealType,
        location: eventData.location,
        maxParticipants: eventData.maxParticipants,
        creatorId: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Crear participantes
    const participants = await Promise.all(
      eventData.participantIds.map(async (participantId) => {
        const participant = await prisma.eventParticipant.create({
          data: {
            eventId: event.id,
            userId: participantId,
            status: 'INVITED'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        });

        // Crear notificación para el participante
        await prisma.notification.create({
          data: {
            userId: participantId,
            type: 'EVENT_INVITATION',
            title: 'Invitación a evento',
            message: `${session.user.name || session.user.email} te invitó al evento "${eventData.title}"`,
            relatedId: event.id
          }
        });

        return participant;
      })
    );

    return NextResponse.json({
      ...event,
      participants
    });

  } catch (error) {
    console.error("Error creando evento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
