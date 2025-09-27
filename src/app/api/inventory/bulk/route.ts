import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { FoodUnit, FoodCategory } from '@/types/inventory';

interface BulkInventoryItem {
  foodId?: string;
  foodName?: string;
  category?: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  notes?: string;
}

// Función para validar y mapear unidades
const validateAndMapUnit = (unit: string): FoodUnit => {
  const unitMap: Record<string, FoodUnit> = {
    'PIECE': FoodUnit.PIECE,
    'GRAM': FoodUnit.GRAM,
    'KILOGRAM': FoodUnit.KILOGRAM,
    'LITER': FoodUnit.LITER,
    'MILLILITER': FoodUnit.MILLILITER,
    'CUP': FoodUnit.CUP,
    'TABLESPOON': FoodUnit.TABLESPOON,
    'TEASPOON': FoodUnit.TEASPOON,
    'POUND': FoodUnit.POUND,
    'OUNCE': FoodUnit.OUNCE,
    // Mapeos adicionales para unidades comunes
    'BOTLE': FoodUnit.LITER, // Botella -> Litros
    'BOTTLE': FoodUnit.LITER,
    'BOT': FoodUnit.LITER,
    'ML': FoodUnit.MILLILITER,
    'L': FoodUnit.LITER,
    'G': FoodUnit.GRAM,
    'KG': FoodUnit.KILOGRAM,
    'LB': FoodUnit.POUND,
    'OZ': FoodUnit.OUNCE,
    'UN': FoodUnit.PIECE,
    'UNIDAD': FoodUnit.PIECE,
    'PIEZA': FoodUnit.PIECE,
    'PIEZAS': FoodUnit.PIECE,
  };

  const normalizedUnit = unit.toUpperCase().trim();
  return unitMap[normalizedUnit] || FoodUnit.PIECE; // Default a PIECE si no se encuentra
};

// Función para validar y mapear categorías
const validateAndMapCategory = (category: string): FoodCategory => {
  const categoryMap: Record<string, FoodCategory> = {
    'VEGETABLE': FoodCategory.VEGETABLE,
    'FRUIT': FoodCategory.FRUIT,
    'MEAT': FoodCategory.MEAT,
    'DAIRY': FoodCategory.DAIRY,
    'GRAIN': FoodCategory.GRAIN,
    'LIQUID': FoodCategory.LIQUID,
    'SPICE': FoodCategory.SPICE,
    'OTHER': FoodCategory.OTHER,
    // Mapeos adicionales
    'VERDURA': FoodCategory.VEGETABLE,
    'FRUTA': FoodCategory.FRUIT,
    'CARNE': FoodCategory.MEAT,
    'LACTEO': FoodCategory.DAIRY,
    'CEREAL': FoodCategory.GRAIN,
    'GRANO': FoodCategory.GRAIN,
    'LIQUIDO': FoodCategory.LIQUID,
    'ESPECIA': FoodCategory.SPICE,
    'CONDIMENTO': FoodCategory.SPICE,
  };

  const normalizedCategory = category.toUpperCase().trim();
  return categoryMap[normalizedCategory] || FoodCategory.OTHER; // Default a OTHER si no se encuentra
};

// POST - Agregar múltiples ingredientes al inventario en una transacción
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Iniciando endpoint /api/inventory/bulk");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("❌ DEBUG: No autorizado - sin sesión");
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log("🔍 DEBUG: Usuario autenticado:", session.user.id);

    const body: { items: BulkInventoryItem[] } = await request.json();
    const { items } = body;

    console.log("🔍 DEBUG: Datos recibidos:", {
      hasItems: !!items,
      itemsLength: items?.length,
      items: items
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("❌ DEBUG: No se proporcionaron ingredientes válidos");
      return NextResponse.json({ 
        error: 'No se proporcionaron ingredientes para agregar' 
      }, { status: 400 });
    }

    console.log(`🚀 DEBUG: Iniciando procesamiento individual para ${items.length} ingredientes`);

    // Procesar cada ingrediente individualmente para evitar timeouts
    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        console.log(`🔍 DEBUG: Procesando ingrediente individual:`, item);
        
        const result = await prisma.$transaction(async (tx) => {
          const { foodId, quantity, unit, expirationDate, notes, foodName, category } = item;
          
          let actualFoodId = foodId;

          // Si no hay foodId, crear el alimento automáticamente
          if (!foodId && foodName) {
            console.log(`🔍 DEBUG: Creando alimento automáticamente: ${foodName}`);
            
            // Validar y mapear unidad y categoría
            const validUnit = validateAndMapUnit(unit);
            const validCategory = validateAndMapCategory(category || 'OTHER');
            
            console.log(`🔍 DEBUG: Unidad mapeada: ${unit} -> ${validUnit}`);
            console.log(`🔍 DEBUG: Categoría mapeada: ${category} -> ${validCategory}`);
            
            const newFood = await tx.food.create({
              data: {
                name: foodName,
                description: `Ingrediente detectado automáticamente: ${foodName}`,
                image: "https://images.unsplash.com/photo-1546470427-5c1d2b0b8b8b?w=400&q=80",
                category: validCategory,
                unit: validUnit,
              }
            });

            actualFoodId = newFood.id;
            console.log(`✅ DEBUG: Alimento creado: ${newFood.name} (ID: ${newFood.id})`);
          }

          // Verificar que tenemos un foodId válido
          if (!actualFoodId) {
            throw new Error(`No se pudo obtener o crear foodId para ${foodName || 'ingrediente desconocido'}`);
          }

          // Verificar si ya existe un item para este ingrediente
          const existingItem = await tx.userIngredientInventory.findUnique({
            where: {
              userId_foodId: {
                userId: session.user.id,
                foodId: actualFoodId
              }
            }
          });

          console.log(`🔍 DEBUG: Item existente:`, existingItem ? "Sí" : "No");

          if (existingItem) {
            console.log(`🔍 DEBUG: Actualizando item existente`);
            // Actualizar cantidad existente
            const validUnit = validateAndMapUnit(unit);
            const updatedItem = await tx.userIngredientInventory.update({
              where: {
                id: existingItem.id
              },
              data: {
                quantity: existingItem.quantity + quantity,
                unit: validUnit,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                notes: notes || existingItem.notes
              },
              include: {
                food: true
              }
            });

            console.log(`✅ DEBUG: Item actualizado:`, updatedItem.id);
            return {
              success: true,
              action: 'updated',
              item: updatedItem
            };
          } else {
            console.log(`🔍 DEBUG: Creando nuevo item`);
            // Crear nuevo item
            const validUnit = validateAndMapUnit(unit);
            const newItem = await tx.userIngredientInventory.create({
              data: {
                userId: session.user.id,
                foodId: actualFoodId,
                quantity,
                unit: validUnit,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                notes
              },
              include: {
                food: true
              }
            });

            console.log(`✅ DEBUG: Item creado:`, newItem.id);
            return {
              success: true,
              action: 'created',
              item: newItem
            };
          }
        });

        results.push(result);
        console.log(`✅ DEBUG: Ingrediente procesado exitosamente:`, result);
        
      } catch (error) {
        console.error(`❌ DEBUG: Error procesando ingrediente ${item.foodId || item.foodName}:`, error);
        // IGNORAR ERRORES - continuar con el siguiente ingrediente
        errors.push({
          foodId: item.foodId || undefined,
          foodName: item.foodName || undefined,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
        console.log(`⚠️ DEBUG: Continuando con el siguiente ingrediente...`);
      }
    }

    console.log(`🔍 DEBUG: Procesamiento completado: ${results.length} exitosos, ${errors.length} errores`);

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: items.length,
        successful: results.length,
        errorCount: errors.length,
        results: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Error en transacción masiva de inventario:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
