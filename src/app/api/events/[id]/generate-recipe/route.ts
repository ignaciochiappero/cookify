import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateRecipeWithInventory } from "@/lib/gemini";
import { createRecipe } from "@/lib/recipeService";
import { formatInventoryIngredients } from "@/lib/recipeService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el evento
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            userPreferences: true
          }
        },
        participants: {
          where: { status: 'ACCEPTED' },
          include: {
            user: {
              include: {
                userPreferences: true,
                ingredientInventory: {
                  include: {
                    food: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el creador del evento
    if (event.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Solo el creador del evento puede generar la receta" },
        { status: 403 }
      );
    }

    // Combinar ingredientes de todos los participantes
    const allIngredients = event.participants.flatMap(participant => 
      participant.user.ingredientInventory.map(inventory => ({
        ...inventory,
        contributedBy: participant.user.name || participant.user.email
      }))
    );

    // Combinar preferencias de salud
    const allHealthConditions = new Set<string>();
    const allPersonalGoals = new Set<string>();
    let totalServings = 0;

    event.participants.forEach(participant => {
      if (participant.user.userPreferences) {
        participant.user.userPreferences.healthConditions.forEach(condition => 
          allHealthConditions.add(condition)
        );
        participant.user.userPreferences.customHealthConditions.forEach(condition => 
          allHealthConditions.add(condition)
        );
        participant.user.userPreferences.personalGoals.forEach(goal => 
          allPersonalGoals.add(goal)
        );
        participant.user.userPreferences.customPersonalGoals.forEach(goal => 
          allPersonalGoals.add(goal)
        );
        totalServings += participant.user.userPreferences.servings;
      }
    });

    // Formatear ingredientes combinados
    const combinedIngredients = formatInventoryIngredients(allIngredients);

    // Crear contexto de preferencias combinadas
    const combinedUserPreferences = {
      healthConditions: Array.from(allHealthConditions),
      customHealthConditions: [],
      personalGoals: Array.from(allPersonalGoals),
      customPersonalGoals: [],
      cookingSkill: 'mas_o_menos', // Promedio
      cookingTime: 'mas_o_menos', // Promedio
      servings: totalServings || event.participants.length * 2,
      country: event.creator.userPreferences?.country || null,
      locationEnabled: false
    };

    // Generar receta colaborativa
    const recipeData = await generateRecipeWithInventory(
      combinedIngredients as any,
      event.mealType as any,
      combinedUserPreferences.servings,
      true, // suggestIngredients
      {
        customTitle: `Receta colaborativa: ${event.title}`,
        customDescription: `Receta creada para el evento "${event.title}" con ingredientes de todos los participantes`,
        preferredIngredients: [],
        userId: session.user.id,
        userPreferences: combinedUserPreferences as any
      }
    );

    // Crear la receta en la base de datos
    const recipe = await createRecipe(recipeData as any, {
      ingredients: combinedIngredients,
      userId: session.user.id,
      customTitle: recipeData.title,
      customDescription: recipeData.description,
      customServings: combinedUserPreferences.servings,
      healthConditions: combinedUserPreferences.healthConditions,
      customHealthConditions: combinedUserPreferences.customHealthConditions
    });

    // Actualizar el evento con la receta generada
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        recipeId: (recipe as any).recipe.id
      },
      include: {
        recipe: true
      }
    });

    // Agregar la receta al calendario de todos los participantes
    console.log(`🔍 DEBUG: Agregando receta al calendario de ${event.participants.length} participantes`);
    console.log(`🔍 DEBUG: Participantes:`, event.participants.map(p => ({ id: p.userId, status: p.status })));
    console.log(`🔍 DEBUG: Fecha del evento: ${event.date}`);
    console.log(`🔍 DEBUG: Tipo de fecha: ${typeof event.date}`);
    console.log(`🔍 DEBUG: Tipo de comida: ${event.mealType}`);
    console.log(`🔍 DEBUG: ID de la receta: ${(recipe as any).recipe.id}`);
    
    // Convertir la fecha a Date si es necesario
    const eventDate = new Date(event.date);
    console.log(`🔍 DEBUG: Fecha convertida: ${eventDate}`);
    console.log(`🔍 DEBUG: Fecha ISO: ${eventDate.toISOString()}`);
    
    if (event.participants.length === 0) {
      console.log(`⚠️ WARNING: No hay participantes aceptados en el evento`);
    }
    
    const calendarPromises = event.participants.map(async (participant) => {
      try {
        console.log(`🔍 DEBUG: Agregando al calendario del usuario ${participant.userId}`);
        
        const calendarEntry = await prisma.mealCalendar.create({
          data: {
            userId: participant.userId,
            date: eventDate,
            mealType: event.mealType,
            recipeId: (recipe as any).recipe.id,
            notes: `Evento colaborativo: ${event.title}`,
            isPlanned: true
          }
        });
        
        console.log(`✅ DEBUG: Calendario creado para usuario ${participant.userId}:`, calendarEntry.id);

        // Crear notificación para el participante
        const notification = await prisma.notification.create({
          data: {
            userId: participant.userId,
            type: 'EVENT_RECIPE_GENERATED',
            title: 'Receta del evento generada',
            message: `La receta para el evento "${event.title}" ha sido generada y agregada a tu calendario`,
            relatedId: event.id
          }
        });
        
        console.log(`✅ DEBUG: Notificación creada para usuario ${participant.userId}:`, notification.id);
      } catch (error) {
        console.error(`❌ ERROR: Error agregando receta al calendario de ${participant.userId}:`, error);
      }
    });

    await Promise.all(calendarPromises);
    console.log(`✅ DEBUG: Proceso de calendario completado para todos los participantes`);
    
    // También agregar al calendario del creador del evento
    try {
      console.log(`🔍 DEBUG: Agregando receta al calendario del creador del evento: ${event.creatorId}`);
      
      const creatorCalendarEntry = await prisma.mealCalendar.create({
        data: {
          userId: event.creatorId,
          date: eventDate,
          mealType: event.mealType,
          recipeId: (recipe as any).recipe.id,
          notes: `Evento colaborativo: ${event.title} (Creador)`,
          isPlanned: true
        }
      });
      
      console.log(`✅ DEBUG: Calendario creado para el creador:`, creatorCalendarEntry.id);
    } catch (error) {
      console.error(`❌ ERROR: Error agregando receta al calendario del creador:`, error);
    }

    return NextResponse.json({
      event: updatedEvent,
      recipe: (recipe as any).recipe,
      combinedData: {
        ingredients: combinedIngredients,
        healthConditions: Array.from(allHealthConditions),
        personalGoals: Array.from(allPersonalGoals),
        totalServings: combinedUserPreferences.servings
      }
    });

  } catch (error) {
    console.error("Error generando receta colaborativa:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
