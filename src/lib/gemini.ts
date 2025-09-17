import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { RecipeIngredient, GeneratedRecipe } from '@/types/recipe';
import { FOOD_UNIT_ABBREVIATIONS } from '@/types/inventory';
import { FoodUnit as PrismaFoodUnit } from '../generated/prisma';
import { MealType, MEAL_TYPE_LABELS } from '@/types/meal-calendar';

// Función para convertir imagen a base64 (solo para cliente)
function fileToGenerativePart(file: File): Promise<Part> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('FileReader no está disponible en el servidor'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const mimeType = file.type;
      resolve({
        inlineData: {
          data: base64.split(',')[1], // Remover el prefijo data:image/...;base64,
          mimeType
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Función para convertir buffer a base64 (para servidor)
function bufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateRecipe(
  ingredients: RecipeIngredient[],
  preferences?: {
    cookingTime?: number;
    difficulty?: string;
    servings?: number;
    dietaryRestrictions?: string[];
    image?: File; // Nueva opción para imagen
  }
): Promise<GeneratedRecipe> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const ingredientNames = ingredients.map(ing => ing.name).join(', ');
    
    let prompt = `Genera una receta completa y detallada usando ÚNICAMENTE estos ingredientes específicos: ${ingredientNames}.

IMPORTANTE: 
- Usa SOLO los ingredientes listados arriba
- NO agregues ingredientes adicionales que no estén en la lista
- Calcula cantidades específicas para cada ingrediente
- Crea una receta realista y deliciosa con estos ingredientes`;

    // Si hay imagen, agregar análisis de imagen al prompt
    if (preferences?.image) {
      prompt += `\n\nTambién tienes una imagen que puedes analizar para inspirarte en la receta. Analiza la imagen y úsala como referencia visual para crear una receta que se vea similar o use técnicas de presentación similares.`;
    }

    prompt += `\n\nPor favor, genera UNA receta completa y detallada que incluya:

1. Título atractivo de la receta
2. Descripción breve (2-3 líneas)
3. Instrucciones paso a paso detalladas
4. Tiempo de cocción estimado en minutos
5. Nivel de dificultad (Fácil, Medio, Difícil)
6. Número de porciones

Requisitos:
- Usa ÚNICAMENTE los ingredientes proporcionados
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

    // Preparar el contenido para Gemini
    const content: (string | Part)[] = [prompt];
    
    // Si hay imagen, agregarla al contenido
    if (preferences?.image) {
      try {
        const imagePart = await fileToGenerativePart(preferences.image);
        content.push(imagePart);
      } catch (error) {
        console.error('Error procesando imagen:', error);
        // Continuar sin imagen si hay error
      }
    }

    const result = await model.generateContent(content);
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
    
    // Si es error de cuota (429), dar mensaje específico
    if (error instanceof Error && error.message.includes('429')) {
      throw new Error('Límite de cuota de API excedido. Por favor, intenta de nuevo más tarde.');
    }
    
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
  suggestIngredients: boolean = false,
  options?: {
    image?: File;
    customTitle?: string;
    customDescription?: string;
    preferredIngredients?: string[];
  }
): Promise<GeneratedRecipeWithInventory> {
  // Verificar que la API key esté configurada
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Extraer opciones
  const { image, customTitle, customDescription, preferredIngredients } = options || {};
  
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

${customTitle ? `TÍTULO SUGERIDO: ${customTitle}` : ''}
${customDescription ? `DESCRIPCIÓN SUGERIDA: ${customDescription}` : ''}
${preferredIngredients && preferredIngredients.length > 0 ? `INGREDIENTES PREFERIDOS A INCLUIR: ${preferredIngredients.join(', ')}` : ''}`;

      // Si hay imagen, agregar análisis de imagen al prompt
      if (image) {
        prompt += `\n\nTambién tienes una imagen que puedes analizar para inspirarte en la receta. Analiza la imagen y úsala como referencia visual para crear una receta que se vea similar o use técnicas de presentación similares.`;
      }

      prompt += `\n\nPor favor, genera UNA receta completa y detallada que incluya:

1. Título atractivo de la receta
2. Descripción breve (2-3 líneas)
3. Instrucciones paso a paso detalladas
4. Tiempo de cocción estimado en minutos
5. Nivel de dificultad (Fácil, Medio, Difícil)
6. Número de porciones
7. Lista de ingredientes necesarios con cantidades específicas

Requisitos:
- Usa principalmente los ingredientes disponibles en mi inventario
${preferredIngredients && preferredIngredients.length > 0 ? '- PRIORIZA especialmente los ingredientes preferidos mencionados arriba' : ''}
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

      // Preparar el contenido para Gemini
      const content: (string | Part)[] = [prompt];
      
      // Si hay imagen, agregarla al contenido
      if (image) {
        try {
          const imagePart = await fileToGenerativePart(image);
          content.push(imagePart);
        } catch (error) {
          console.error('Error procesando imagen:', error);
          // Continuar sin imagen si hay error
        }
      }

      const result = await model.generateContent(content);
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

// Nueva interfaz para ingredientes detectados
interface DetectedIngredient {
  name: string;
  quantity: number;
  unit: PrismaFoodUnit;
  category: string;
  confidence: number; // 0-1
}

// Nueva interfaz para plan de comidas
interface MealPlan {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast?: {
      recipeId: string;
      title: string;
      ingredients: string[];
    };
    lunch?: {
      recipeId: string;
      title: string;
      ingredients: string[];
    };
    snack?: {
      recipeId: string;
      title: string;
      ingredients: string[];
    };
    dinner?: {
      recipeId: string;
      title: string;
      ingredients: string[];
    };
  };
}

// Función para analizar imagen de ingredientes
export async function analyzeIngredientImage(
  image: File | Buffer,
  currentInventory: InventoryIngredient[],
  mimeType?: string
): Promise<{
  detectedIngredients: DetectedIngredient[];
  missingIngredients: DetectedIngredient[];
  suggestions: string[];
}> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Formatear inventario actual
  const inventoryText = currentInventory.map(item => {
    const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
    return `${item.name}: ${item.quantity} ${unitAbbr}`;
  }).join(', ');

  const prompt = `Analiza esta imagen de ingredientes/alimentos y compara con el inventario actual del usuario.

INVENTARIO ACTUAL: ${inventoryText}

Por favor, analiza la imagen y:

1. Identifica todos los ingredientes/alimentos visibles en la imagen
2. Estima las cantidades aproximadas de cada ingrediente
3. Determina qué ingredientes del inventario actual están presentes en la imagen
4. Identifica qué ingredientes nuevos (no en el inventario) están en la imagen
5. Sugiere ingredientes básicos que podrían faltar para cocinar

IMPORTANTE: Responde ÚNICAMENTE en formato JSON válido, sin texto adicional, con la siguiente estructura exacta:
{
  "detectedIngredients": [
    {
      "name": "nombre del ingrediente",
      "quantity": 2.5,
      "unit": "KILOGRAM",
      "category": "VEGETABLE",
      "confidence": 0.9
    }
  ],
  "missingIngredients": [
    {
      "name": "ingrediente que falta en inventario",
      "quantity": 1.0,
      "unit": "PIECE",
      "category": "FRUIT",
      "confidence": 0.8
    }
  ],
  "suggestions": [
    "Sal - ingrediente básico que siempre se necesita",
    "Aceite de oliva - para cocinar",
    "Especias básicas - para sazonar"
  ]
}

CRÍTICO: Tu respuesta debe ser SOLO el JSON, sin explicaciones adicionales, sin markdown, sin texto antes o después del JSON.

REGLAS:
- Usa solo las unidades: PIECE, GRAM, KILOGRAM, LITER, MILLILITER, CUP, TABLESPOON, TEASPOON, POUND, OUNCE
- Usa solo las categorías: VEGETABLE, FRUIT, MEAT, DAIRY, GRAIN, LIQUID, SPICE, OTHER
- confidence debe ser un número entre 0 y 1
- quantity debe ser un número positivo
- Responde en español`;

  try {
    let imagePart: Part;
    
    // Siempre usar buffer en el servidor (API routes)
    if (typeof window === 'undefined' || image instanceof Buffer) {
      // En el servidor, usar buffer
      const buffer = image instanceof Buffer ? image : Buffer.from(await (image as File).arrayBuffer());
      imagePart = bufferToGenerativePart(buffer, mimeType || 'image/jpeg');
    } else {
      // En el cliente, usar File
      imagePart = await fileToGenerativePart(image as File);
    }
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Limpiar la respuesta
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Buscar el JSON en la respuesta si no está limpio
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    console.log('Respuesta de Gemini:', cleanText);
    
    // Parsear el JSON
    let analysisData;
    try {
      analysisData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError);
      console.error('Texto recibido:', cleanText);
      throw new Error('La respuesta de la IA no está en formato JSON válido');
    }

    return {
      detectedIngredients: analysisData.detectedIngredients || [],
      missingIngredients: analysisData.missingIngredients || [],
      suggestions: analysisData.suggestions || []
    };

  } catch (error) {
    console.error('Error analizando imagen:', error);
    throw new Error('Error al analizar la imagen. Por favor, intenta de nuevo.');
  }
}

// Función para generar plan de comidas
export async function generateMealPlan(
  inventory: InventoryIngredient[],
  days: number,
  startDate: Date
): Promise<MealPlan[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Formatear inventario
  const inventoryText = inventory.map(item => {
    const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
    return `${item.name}: ${item.quantity} ${unitAbbr}`;
  }).join(', ');

  // Generar fechas
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const prompt = `Genera un plan de comidas para ${days} días usando estos ingredientes disponibles:

INVENTARIO: ${inventoryText}

FECHAS: ${dates.join(', ')}

Por favor, crea un plan de comidas que incluya:
- Desayuno, almuerzo, merienda y cena para cada día
- Recetas que usen principalmente los ingredientes disponibles
- Variedad en los platos a lo largo de los días
- Considera el balance nutricional

IMPORTANTE: Responde en formato JSON con la siguiente estructura exacta:
{
  "mealPlan": [
    {
      "date": "2024-01-15",
      "meals": {
        "breakfast": {
          "recipeId": "uuid-generado",
          "title": "Título de la receta",
          "ingredients": ["nombre-ingrediente-específico-1", "nombre-ingrediente-específico-2"]
        },
        "lunch": {
          "recipeId": "uuid-generado",
          "title": "Título de la receta",
          "ingredients": ["nombre-ingrediente-específico-1", "nombre-ingrediente-específico-2"]
        },
        "snack": {
          "recipeId": "uuid-generado",
          "title": "Título de la receta",
          "ingredients": ["nombre-ingrediente-específico-1"]
        },
        "dinner": {
          "recipeId": "uuid-generado",
          "title": "Título de la receta",
          "ingredients": ["nombre-ingrediente-específico-1", "nombre-ingrediente-específico-2"]
        }
      }
    }
  ]
}

REGLAS:
- Genera un UUID único para cada recipeId
- Usa SOLO los ingredientes disponibles en el inventario (usa los nombres exactos)
- En el campo "ingredients", incluye los nombres exactos de los ingredientes del inventario
- Asegúrate de que cada día tenga al menos desayuno, almuerzo y cena
- Las recetas deben ser realistas y fáciles de preparar
- Responde ÚNICAMENTE en formato JSON válido, sin texto adicional
- No incluyas explicaciones ni comentarios fuera del JSON
- NO uses "undefined" ni placeholders genéricos en los ingredientes

IMPORTANTE: Responde solo con el JSON, sin texto adicional antes o después.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Respuesta de Gemini para plan de comidas:', text);

    // Limpiar la respuesta y extraer JSON
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Buscar el JSON en la respuesta usando regex
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    // Parsear el JSON
    const planData = JSON.parse(cleanText);

    return planData.mealPlan || [];

  } catch (error) {
    console.error('Error generando plan de comidas:', error);
    if (error instanceof SyntaxError) {
      console.error('Error de parsing JSON:', error.message);
    }
    throw new Error('Error al generar el plan de comidas. Por favor, intenta de nuevo.');
  }
}
