import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { FoodCategory, FoodUnit } from '@/types/inventory';

// POST - Poblar la base de datos con alimentos comunes
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Lista de alimentos comunes que faltan
    const commonFoods = [
      // Frutas
      { name: 'Naranja', description: 'Fruta cítrica rica en vitamina C', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Manzana', description: 'Fruta dulce y crujiente', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Plátano', description: 'Fruta rica en potasio', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Fresa', description: 'Fruta roja y dulce', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Uva', description: 'Fruta pequeña y dulce', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Limón', description: 'Fruta cítrica ácida', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Lima', description: 'Fruta cítrica verde', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Pera', description: 'Fruta dulce y jugosa', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Durazno', description: 'Fruta de hueso dulce', category: 'FRUIT', unit: 'PIECE' },
      { name: 'Cereza', description: 'Fruta pequeña y roja', category: 'FRUIT', unit: 'PIECE' },

      // Verduras
      { name: 'Lechuga', description: 'Verdura de hoja verde', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Pepino', description: 'Verdura verde y refrescante', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Zanahoria', description: 'Verdura naranja rica en betacaroteno', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Cebolla', description: 'Verdura aromática', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Ajo', description: 'Condimento aromático', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Pimiento', description: 'Verdura de colores variados', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Brócoli', description: 'Verdura verde crucífera', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Coliflor', description: 'Verdura blanca crucífera', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Espinaca', description: 'Verdura de hoja verde rica en hierro', category: 'VEGETABLE', unit: 'PIECE' },
      { name: 'Apio', description: 'Verdura crujiente y refrescante', category: 'VEGETABLE', unit: 'PIECE' },

      // Carnes
      { name: 'Pollo', description: 'Carne blanca magra', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Cerdo', description: 'Carne de cerdo', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Res', description: 'Carne de res', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Pescado', description: 'Carne de pescado', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Salmón', description: 'Pescado rico en omega-3', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Atún', description: 'Pescado azul', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Jamón', description: 'Carne curada', category: 'MEAT', unit: 'KILOGRAM' },
      { name: 'Tocino', description: 'Carne de cerdo curada', category: 'MEAT', unit: 'KILOGRAM' },

      // Lácteos
      { name: 'Leche', description: 'Bebida láctea', category: 'DAIRY', unit: 'LITER' },
      { name: 'Queso', description: 'Producto lácteo fermentado', category: 'DAIRY', unit: 'KILOGRAM' },
      { name: 'Yogur', description: 'Producto lácteo fermentado', category: 'DAIRY', unit: 'PIECE' },
      { name: 'Mantequilla', description: 'Grasa láctea', category: 'DAIRY', unit: 'GRAM' },
      { name: 'Crema', description: 'Grasa láctea líquida', category: 'DAIRY', unit: 'LITER' },
      { name: 'Huevo', description: 'Proteína de ave', category: 'DAIRY', unit: 'PIECE' },
      { name: 'Huevos', description: 'Proteína de ave', category: 'DAIRY', unit: 'PIECE' },

      // Granos
      { name: 'Arroz', description: 'Cereal básico', category: 'GRAIN', unit: 'KILOGRAM' },
      { name: 'Pasta', description: 'Producto de trigo', category: 'GRAIN', unit: 'KILOGRAM' },
      { name: 'Pan', description: 'Producto de trigo horneado', category: 'GRAIN', unit: 'PIECE' },
      { name: 'Avena', description: 'Cereal integral', category: 'GRAIN', unit: 'KILOGRAM' },
      { name: 'Quinoa', description: 'Pseudo-cereal', category: 'GRAIN', unit: 'KILOGRAM' },
      { name: 'Trigo', description: 'Cereal básico', category: 'GRAIN', unit: 'KILOGRAM' },

      // Líquidos
      { name: 'Agua', description: 'Líquido vital', category: 'LIQUID', unit: 'LITER' },
      { name: 'Aceite', description: 'Grasa líquida', category: 'LIQUID', unit: 'LITER' },
      { name: 'Vinagre', description: 'Líquido ácido', category: 'LIQUID', unit: 'LITER' },
      { name: 'Vino', description: 'Bebida alcohólica', category: 'LIQUID', unit: 'LITER' },
      { name: 'Cerveza', description: 'Bebida alcohólica', category: 'LIQUID', unit: 'LITER' },
      { name: 'Jugo', description: 'Bebida de frutas', category: 'LIQUID', unit: 'LITER' },

      // Especias
      { name: 'Sal', description: 'Condimento básico', category: 'SPICE', unit: 'GRAM' },
      { name: 'Pimienta', description: 'Especia picante', category: 'SPICE', unit: 'GRAM' },
      { name: 'Orégano', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Eneldo', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Perejil', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Cilantro', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Albahaca', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Tomillo', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Romero', description: 'Hierba aromática', category: 'SPICE', unit: 'GRAM' },
      { name: 'Laurel', description: 'Hoja aromática', category: 'SPICE', unit: 'GRAM' },
    ];

    console.log(`🌱 Iniciando seed de ${commonFoods.length} alimentos comunes`);

    // Usar transacción para insertar todos los alimentos
    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      const skipped = [];

      for (const food of commonFoods) {
        try {
          // Verificar si ya existe
          const existing = await tx.food.findFirst({
            where: {
              name: {
                equals: food.name,
                mode: 'insensitive'
              }
            }
          });

          if (existing) {
            skipped.push(food.name);
            continue;
          }

          // Crear nuevo alimento
          const newFood = await tx.food.create({
            data: {
              name: food.name,
              description: food.description,
              image: `https://images.unsplash.com/photo-1546470427-5c1d2b0b8b8b?w=400&q=80`,
              category: food.category as FoodCategory,
              unit: food.unit as FoodUnit,
            }
          });

          created.push(newFood);
        } catch (error) {
          console.error(`Error creando ${food.name}:`, error);
        }
      }

      return { created, skipped };
    });

    console.log(`✅ Seed completado: ${result.created.length} creados, ${result.skipped.length} omitidos`);

    return NextResponse.json({
      success: true,
      data: {
        total: commonFoods.length,
        created: result.created.length,
        skipped: result.skipped.length,
        createdItems: result.created,
        skippedItems: result.skipped
      }
    });

  } catch (error) {
    console.error('Error en seed de alimentos:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
