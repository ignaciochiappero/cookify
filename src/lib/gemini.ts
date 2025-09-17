import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecipeIngredient, GeneratedRecipe } from '@/types/recipe';
import { FOOD_UNIT_ABBREVIATIONS } from '@/types/inventory';
import { FoodUnit as PrismaFoodUnit } from '../generated/prisma';
import { MealType, MEAL_TYPE_LABELS } from '@/types/meal-calendar';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateRecipe(
  ingredients: RecipeIngredient[],
  preferences?: {
    cookingTime?: number;
    difficulty?: string;
    servings?: number;
    dietaryRestrictions?: string[];
  }
): Promise<GeneratedRecipe> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const ingredientNames = ingredients.map(ing => ing.name).join(', ');
    
    let prompt = `Necesito que me crees diferentes recetas utilizando estos ingredientes: ${ingredientNames}.

Por favor, genera UNA receta completa y detallada que incluya:

1. Título atractivo de la receta
2. Descripción breve (2-3 líneas)
3. Instrucciones paso a paso detalladas
4. Tiempo de cocción estimado en minutos
5. Nivel de dificultad (Fácil, Medio, Difícil)
6. Número de porciones

Requisitos:
- Usa principalmente los ingredientes proporcionados
- Puedes sugerir ingredientes básicos adicionales (sal, aceite, especias comunes)
- Las instrucciones deben ser claras y fáciles de seguir
- El tiempo de cocción debe ser realista
- Responde en español`;

    // Agregar preferencias si existen
    if (preferences) {
      if (preferences.cookingTime) {
        prompt += `\n- Tiempo de cocción preferido: máximo ${preferences.cookingTime} minutos`;
      }
      if (preferences.difficulty) {
        prompt += `\n- Nivel de dificultad preferido: ${preferences.difficulty}`;
      }
      if (preferences.servings) {
        prompt += `\n- Número de porciones: ${preferences.servings}`;
      }
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
        prompt += `\n- Restricciones dietéticas: ${preferences.dietaryRestrictions.join(', ')}`;
      }
    }

    prompt += `\n\nResponde en formato JSON con la siguiente estructura:
{
  "title": "Título de la receta",
  "description": "Descripción breve",
  "instructions": "Instrucciones paso a paso detalladas. Separa cada paso con un salto de línea doble para mejor legibilidad.",
  "cookingTime": 30,
  "difficulty": "Fácil",
  "servings": 4
}

IMPORTANTE: El campo "instructions" debe ser un STRING, no un array. Separa los pasos con \\n\\n para mejor formato.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpiar la respuesta (remover markdown si existe)
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parsear el JSON
    const recipeData = JSON.parse(cleanText);

    // Convertir instrucciones de array a string si es necesario
    let instructions = recipeData.instructions;
    if (Array.isArray(instructions)) {
      instructions = instructions.join('\n\n');
    }

    return {
      title: recipeData.title,
      description: recipeData.description,
      instructions: instructions,
      cookingTime: recipeData.cookingTime,
      difficulty: recipeData.difficulty,
      servings: recipeData.servings
    };

  } catch (error) {
    console.error('Error generando receta con Gemini:', error);
    throw new Error('Error al generar la receta. Por favor, intenta de nuevo.');
  }
}

interface InventoryIngredient {
  name: string;
  quantity: number;
  unit: PrismaFoodUnit;
  category: string;
}

interface GeneratedRecipeWithInventory extends GeneratedRecipe {
  suggestedIngredients?: string[];
}

export async function generateRecipeWithInventory(
  inventory: InventoryIngredient[],
  mealType: MealType,
  servings?: number,
  suggestIngredients: boolean = false
): Promise<GeneratedRecipeWithInventory> {
  // Verificar que la API key esté configurada
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Sistema de reintentos para manejar sobrecarga de API
  const maxRetries = 3;
  const baseDelay = 2000; // 2 segundos base
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt}/${maxRetries} para generar receta de ${mealType}`);

      // Formatear inventario con cantidades
      const inventoryText = inventory.map(item => {
        const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
        return `${item.name}: ${item.quantity} ${unitAbbr}`;
      }).join(', ');

      const mealTypeLabel = MEAL_TYPE_LABELS[mealType];
      
      let prompt = `Necesito que me crees una receta para ${mealTypeLabel.toLowerCase()} utilizando estos ingredientes disponibles en mi inventario:

${inventoryText}

Por favor, genera UNA receta completa y detallada que incluya:

1. Título atractivo de la receta
2. Descripción breve (2-3 líneas)
3. Instrucciones paso a paso detalladas
4. Tiempo de cocción estimado en minutos
5. Nivel de dificultad (Fácil, Medio, Difícil)
6. Número de porciones
7. Lista de ingredientes necesarios con cantidades específicas

Requisitos:
- Usa principalmente los ingredientes disponibles en mi inventario
- Calcula las cantidades exactas necesarias para la receta
- Puedes sugerir ingredientes básicos adicionales (sal, aceite, especias comunes) si es necesario
- Las instrucciones deben ser claras y fáciles de seguir
- El tiempo de cocción debe ser realista
- Asegúrate de que la receta sea apropiada para ${mealTypeLabel.toLowerCase()}
- Responde en español`;

      if (servings) {
        prompt += `\n- Número de porciones: ${servings}`;
      }

      if (suggestIngredients) {
        prompt += `\n- También sugiere ingredientes adicionales que podrían mejorar la receta o crear más variedad`;
      }

      prompt += `\n\nResponde en formato JSON con la siguiente estructura:
{
  "title": "Título de la receta",
  "description": "Descripción breve",
  "instructions": "Instrucciones paso a paso detalladas. Separa cada paso con un salto de línea doble para mejor legibilidad.",
  "cookingTime": 30,
  "difficulty": "Fácil",
  "servings": 4,
  "suggestedIngredients": ["ingrediente1", "ingrediente2", "ingrediente3"]
}

IMPORTANTE: 
- El campo "instructions" debe ser un STRING, no un array. Separa los pasos con \\n\\n para mejor formato.
- El campo "suggestedIngredients" debe ser un array de strings con ingredientes adicionales sugeridos.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Limpiar la respuesta (remover markdown si existe)
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Parsear el JSON
      const recipeData = JSON.parse(cleanText);

      // Convertir instrucciones de array a string si es necesario
      let instructions = recipeData.instructions;
      if (Array.isArray(instructions)) {
        instructions = instructions.join('\n\n');
      }

      console.log(`✅ Receta generada exitosamente en intento ${attempt} para ${mealType}`);
      return {
        title: recipeData.title,
        description: recipeData.description,
        instructions: instructions,
        cookingTime: recipeData.cookingTime,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings,
        suggestedIngredients: recipeData.suggestedIngredients || []
      };

    } catch (error) {
      console.error(`❌ Error en intento ${attempt}/${maxRetries} para ${mealType}:`, error);
      
      // Verificar si es un error de sobrecarga (503) o rate limiting
      const isOverloadError = error instanceof Error && 
        (error.message.includes('503') || 
         error.message.includes('overloaded') || 
         error.message.includes('Service Unavailable') ||
         error.message.includes('rate limit'));
      
      // Si es el último intento o no es un error de sobrecarga, lanzar el error
      if (attempt === maxRetries || !isOverloadError) {
        // Log más detallado del error
        if (error instanceof Error) {
          console.error('Gemini error message:', error.message);
          console.error('Gemini error stack:', error.stack);
        }
        
        // Verificar si es un error de API key
        if (error instanceof Error && error.message.includes('API_KEY')) {
          throw new Error('Error de configuración de API. Verifica la clave de Gemini.');
        }
        
        // Verificar si es un error de red
        if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
          throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        
        throw new Error(`Error al generar la receta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
      
      // Si es un error de sobrecarga y no es el último intento, esperar y reintentar
      if (isOverloadError) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(`⏳ API sobrecargada. Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(`No se pudo generar la receta después de ${maxRetries} intentos. La API de Gemini está sobrecargada.`);
}
