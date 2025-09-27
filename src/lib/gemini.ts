import { generateText, type ModelMessage } from "ai";
import { RecipeIngredient, GeneratedRecipe } from "@/types/recipe";
import { FOOD_UNIT_ABBREVIATIONS } from "@/types/inventory";
import { FoodUnit as PrismaFoodUnit } from "../generated/prisma";
import { MealType, MEAL_TYPE_LABELS } from "@/types/meal-calendar";
import {
  model,
} from "./ai-provider";

/**
 * Función para parsear respuestas del modelo local que pueden venir en formato JSON o Markdown
 */
function parseModelResponse(text: string): unknown {
  try {
    // Primero intentar parsear como JSON
    let cleanText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Buscar el JSON en la respuesta si no está limpio
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    // Intentar parsear como JSON
    try {
      return JSON.parse(cleanText);
    } catch (jsonError) {
      // Si falla el JSON, parsear como Markdown
      return parseMarkdownResponse(text);
    }
  } catch (error) {
    console.error("Error parseando respuesta del modelo:", error);
    throw new Error("Error al procesar la respuesta del modelo");
  }
}

/**
 * Función para parsear respuestas en formato Markdown del modelo local
 */
function parseMarkdownResponse(text: string): unknown {
  try {
    console.log(
      "Parseando respuesta Markdown:",
      text.substring(0, 200) + "..."
    );
    console.log("🔍 DEBUG: Texto completo de la IA:", text);

    // Extraer título - buscar patrón "**Título:** [título en línea siguiente]"
    let titleMatch = text.match(/\*\*Título:\*\*\s*(.+)/);
    if (!titleMatch) {
      // Buscar patrón "**Título:**" seguido de salto de línea y el título
      titleMatch = text.match(/\*\*Título:\*\*\s*\n\s*(.+)/);
    }
    if (!titleMatch) {
      // Buscar patrón "## Título"
      titleMatch = text.match(/##\s*(.+)/);
    }
    if (!titleMatch) {
      // Buscar patrón "**Título**" (sin dos puntos)
      titleMatch = text.match(/\*\*(.+?)\*\*/);
    }
    if (!titleMatch) {
      // Buscar patrón "Título: [título real]"
      titleMatch = text.match(/Título:\s*(.+)/);
    }
    if (!titleMatch) {
      // Buscar cualquier línea que contenga "Título" seguido de dos puntos
      titleMatch = text.match(/Título[:\s]+(.+)/);
    }
    if (!titleMatch) {
      // Buscar la primera línea que no sea vacía
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        titleMatch = ["", lines[0].trim()];
      }
    }
    
    console.log("🔍 DEBUG: titleMatch encontrado:", titleMatch);
    const title = titleMatch ? titleMatch[1].trim() : "Receta Generada";
    console.log("🔍 DEBUG: Título extraído:", title);

    // Extraer descripción (texto después del título hasta los ingredientes)
    let descriptionMatch = text.match(
      /\*\*Descripción:\*\*\s*([\s\S]+?)(?=\*\*|$)/
    );
    if (!descriptionMatch) {
      // Buscar descripción sin formato específico
      descriptionMatch = text.match(
        /Descripción:\s*([\s\S]+?)(?=Tiempo|Ingredientes|$)/
      );
    }
    const description = descriptionMatch
      ? descriptionMatch[1].trim()
      : "Receta deliciosa generada con IA";

    // Extraer ingredientes
    let ingredientsMatch = text.match(
      /\*\*Ingredientes:\*\*\s*([\s\S]*?)(?=\*\*|$)/
    );
    if (!ingredientsMatch) {
      // Buscar ingredientes sin formato específico
      ingredientsMatch = text.match(
        /Ingredientes:\s*([\s\S]*?)(?=Instrucciones|$)/
      );
    }
    const ingredientsText = ingredientsMatch ? ingredientsMatch[1] : "";

    // Parsear ingredientes individuales
    const ingredients = [];
    const ingredientLines = ingredientsText
      .split("\n")
      .filter(
        (line) => line.trim() && (line.includes("*") || line.includes("•"))
      );

    for (const line of ingredientLines) {
      // Manejar diferentes formatos de ingredientes
      let match = line.match(/\*\s*(.+?):\s*(.+)/);
      if (!match) {
        match = line.match(/•\s*(.+?):\s*(.+)/);
      }
      if (!match) {
        match = line.match(/\*\s*(.+)/);
      }
      if (!match) {
        match = line.match(/•\s*(.+)/);
      }

      if (match) {
        ingredients.push({
          name: match[1].trim(),
          quantity: 1, // Valor por defecto
          unit: "PIECE",
        });
      }
    }

    // Extraer tiempo de cocción
    let cookingTimeMatch = text.match(
      /\*\*Tiempo de Cocción Estimado:\*\*\s*(.+?)(?=\*\*|$)/
    );
    if (!cookingTimeMatch) {
      cookingTimeMatch = text.match(
        /Tiempo de Cocción Estimado:\s*(.+?)(?=\n|$)/
      );
    }
    const cookingTimeText = cookingTimeMatch
      ? cookingTimeMatch[1]
      : "30 minutos";
    const cookingTime = extractCookingTime(cookingTimeText);

    // Extraer dificultad
    let difficultyMatch = text.match(
      /\*\*Nivel de Dificultad:\*\*\s*(.+?)(?=\*\*|$)/
    );
    if (!difficultyMatch) {
      difficultyMatch = text.match(/Nivel de Dificultad:\s*(.+?)(?=\n|$)/);
    }
    const difficulty = difficultyMatch ? difficultyMatch[1].trim() : "Fácil";

    // Extraer porciones
    let servingsMatch = text.match(
      /\*\*Número de Porciones:\*\*\s*(.+?)(?=\*\*|$)/
    );
    if (!servingsMatch) {
      servingsMatch = text.match(/Número de Porciones:\s*(.+?)(?=\n|$)/);
    }
    const servingsText = servingsMatch ? servingsMatch[1] : "4";
    const servings = extractServings(servingsText);

    // Extraer instrucciones - mejorar el regex para capturar todo el contenido
    let instructionsMatch = text.match(
      /\*\*Instrucciones:\*\*\s*([\s\S]*?)(?=\*\*|$)/
    );
    if (!instructionsMatch) {
      instructionsMatch = text.match(/Instrucciones:\s*([\s\S]*?)(?=\*\*|$)/);
    }
    if (!instructionsMatch) {
      // Buscar instrucciones numeradas
      instructionsMatch = text.match(/(\d+\.\s*[\s\S]*)/);
    }

    let instructions = instructionsMatch
      ? instructionsMatch[1].trim()
      : "Sigue las instrucciones paso a paso.";

    // Limpiar las instrucciones de caracteres extraños
    instructions = instructions
      .replace(/\*\*/g, "") // Remover **
      .replace(/\*/g, "") // Remover *
      .trim();

    console.log("Datos extraídos:", {
      title,
      description: description.substring(0, 100) + "...",
      instructions: instructions.substring(0, 100) + "...",
      cookingTime,
      difficulty,
      servings,
      ingredientsCount: ingredients.length,
    });

    return {
      title,
      description,
      instructions,
      cookingTime,
      difficulty,
      servings,
      suggestedIngredients: [],
    };
  } catch (error) {
    console.error("Error parseando respuesta Markdown:", error);
    // Retornar datos por defecto si falla el parsing
    return {
      title: "Receta Generada",
      description: "Receta deliciosa generada con IA",
      instructions: "Sigue las instrucciones paso a paso.",
      cookingTime: 30,
      difficulty: "Fácil",
      servings: 4,
      suggestedIngredients: [],
    };
  }
}

/**
 * Extraer tiempo de cocción de texto
 */
function extractCookingTime(text: string): number {
  const timeMatch = text.match(/(\d+)/);
  return timeMatch ? parseInt(timeMatch[1]) : 30;
}

/**
 * Extraer número de porciones de texto
 */
function extractServings(text: string): number {
  const servingsMatch = text.match(/(\d+)/);
  return servingsMatch ? parseInt(servingsMatch[1]) : 4;
}

// Función para convertir imagen a base64 (solo para cliente)
function fileToGenerativePart(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("FileReader no está disponible en el servidor"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const mimeType = file.type;
      resolve({
        type: "image",
        image: base64.split(",")[1], // Remover el prefijo data:image/...;base64,
        mimeType,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Función para convertir buffer a base64 (para servidor)
function bufferToGenerativePart(buffer: Buffer, mimeType: string): unknown {
  return {
    type: "image",
    image: buffer.toString("base64"),
    mimeType,
  };
}

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
    const ingredientNames = ingredients.map((ing) => ing.name).join(", ");

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
      if (
        preferences.dietaryRestrictions &&
        preferences.dietaryRestrictions.length > 0
      ) {
        prompt += `\n- Restricciones dietéticas: ${preferences.dietaryRestrictions.join(
          ", "
        )}`;
      }
    }

    prompt += `\n\nIMPORTANTE: El campo "instructions" debe ser un STRING, no un array. Separa los pasos con \\n\\n para mejor formato.`;

    // Preparar el contenido para el modelo
    const content: (string | unknown)[] = [prompt];

    // Si hay imagen, agregarla al contenido
    if (preferences?.image) {
      try {
        const imagePart = await fileToGenerativePart(preferences.image);
        content.push(imagePart);
      } catch (error) {
        console.error("Error procesando imagen:", error);
        // Continuar sin imagen si hay error
      }
    }

    const result = await generateText({
      model: model,
      prompt: prompt,
    });

    // Parsear la respuesta del modelo local
    const recipeData = parseModelResponse(result.text);

    // Verificar que recipeData es un objeto
    if (typeof recipeData !== 'object' || recipeData === null) {
      throw new Error('Datos de receta inválidos');
    }

    const data = recipeData as Record<string, unknown>;

    // Convertir instrucciones de array a string si es necesario
    let instructions = data.instructions;
    if (Array.isArray(instructions)) {
      instructions = instructions.join("\n\n");
    }

    return {
      title: data.title as string,
      description: data.description as string,
      instructions: instructions as string,
      cookingTime: data.cookingTime as number,
      difficulty: data.difficulty as string,
      servings: data.servings as number,
    };
  } catch (error) {
    console.error("Error generando receta con LM Studio:", error);

    // Si es error de cuota (429), dar mensaje específico
    if (error instanceof Error && error.message.includes("429")) {
      throw new Error(
        "Límite de cuota de API excedido. Por favor, intenta de nuevo más tarde."
      );
    }

    throw new Error("Error al generar la receta. Por favor, intenta de nuevo.");
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
    userId?: string; // Necesario para buscar recetas existentes
  }
): Promise<GeneratedRecipeWithInventory> {
  // Extraer opciones
  const { image, customTitle, customDescription, preferredIngredients, userId } =
    options || {};

  // Sistema de reintentos para manejar sobrecarga de API
  const maxRetries = 3;
  const baseDelay = 2000; // 2 segundos base

  // PASO 1: Preseleccionar ingredientes según el tipo de comida
  const preselectIngredientsForMealType = (inventory: InventoryIngredient[], mealType: MealType) => {
    console.log(`🍽️ DEBUG: Preseleccionando ingredientes para ${mealType}...`);
    
    // Definir categorías de ingredientes por tipo de comida
    const mealTypeCategories = {
      'BREAKFAST': {
        primary: ['huevos', 'pan', 'leche', 'yogur', 'queso', 'mantequilla', 'jamón', 'cereales', 'avena'],
        secondary: ['frutas', 'mermelada', 'miel', 'café', 'té', 'galletas', 'bizcochos'],
        avoid: ['carne', 'pollo', 'pescado', 'arroz', 'pasta', 'papas', 'cebolla', 'tomate']
      },
      'LUNCH': {
        primary: ['carne', 'pollo', 'pescado', 'arroz', 'pasta', 'papas', 'cebolla', 'tomate', 'lechuga'],
        secondary: ['queso', 'huevos', 'pan', 'aceite', 'sal', 'pimienta', 'especias'],
        avoid: ['leche', 'yogur', 'cereales', 'mermelada', 'café', 'té']
      },
      'SNACK': {
        primary: ['frutas', 'yogur', 'galletas', 'bizcochos', 'queso', 'pan', 'mermelada'],
        secondary: ['leche', 'café', 'té', 'miel', 'nueces', 'almendras'],
        avoid: ['carne', 'pollo', 'pescado', 'arroz', 'pasta', 'papas', 'cebolla']
      },
      'DINNER': {
        primary: ['pescado', 'pollo', 'verduras', 'ensalada', 'sopa', 'pasta ligera'],
        secondary: ['queso', 'huevos', 'pan', 'aceite', 'especias', 'hierbas'],
        avoid: ['cereales', 'mermelada', 'café', 'té', 'galletas', 'bizcochos']
      }
    };

    const categories = mealTypeCategories[mealType] || mealTypeCategories['LUNCH'];
    const selectedIngredients: InventoryIngredient[] = [];
    const usedNames = new Set<string>();

    // Primero seleccionar ingredientes primarios (3-4)
    for (const ingredient of inventory) {
      if (selectedIngredients.length >= 4) break;
      
      const name = ingredient.name.toLowerCase();
      const isPrimary = categories.primary.some(cat => 
        name.includes(cat) || cat.includes(name) || 
        name.includes(cat.slice(0, 4)) || cat.includes(name.slice(0, 4))
      );
      
      const isAvoid = categories.avoid.some(cat => 
        name.includes(cat) || cat.includes(name)
      );

      if (isPrimary && !isAvoid && !usedNames.has(name)) {
        selectedIngredients.push(ingredient);
        usedNames.add(name);
        console.log(`✅ DEBUG: Ingrediente primario seleccionado: ${ingredient.name}`);
      }
    }

    // Si no hay suficientes primarios, agregar secundarios
    if (selectedIngredients.length < 3) {
      for (const ingredient of inventory) {
        if (selectedIngredients.length >= 4) break;
        
        const name = ingredient.name.toLowerCase();
        const isSecondary = categories.secondary.some(cat => 
          name.includes(cat) || cat.includes(name)
        );
        
        const isAvoid = categories.avoid.some(cat => 
          name.includes(cat) || cat.includes(name)
        );

        if (isSecondary && !isAvoid && !usedNames.has(name)) {
          selectedIngredients.push(ingredient);
          usedNames.add(name);
          console.log(`✅ DEBUG: Ingrediente secundario seleccionado: ${ingredient.name}`);
        }
      }
    }

    console.log(`🎯 DEBUG: Preseleccionados ${selectedIngredients.length} ingredientes para ${mealType}:`, 
      selectedIngredients.map(ing => ing.name));

    return selectedIngredients;
  };

  // Preseleccionar ingredientes específicos para este tipo de comida
  const preselectedIngredients = preselectIngredientsForMealType(inventory, mealType);
  
  // Analizar recetas existentes para evitar repeticiones
  let existingRecipesContext = "";
  if (userId) {
    try {
      console.log("🔍 DEBUG: Analizando recetas existentes para evitar repeticiones...");
      
      // Importar prisma dinámicamente para evitar problemas de importación
      const { default: prisma } = await import("@/lib/prisma");
      
      // Buscar 3 recetas aleatorias del mismo tipo de comida
      const existingRecipes = await prisma.recipe.findMany({
        where: {
          userId: userId,
        },
        take: 3,
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`🔍 DEBUG: Encontradas ${existingRecipes.length} recetas existentes`);

      if (existingRecipes.length > 0) {
        const analyzedIngredients = new Set<string>();
        const analyzedTitles = new Set<string>();
        const analyzedMethods = new Set<string>();

        for (const recipe of existingRecipes) {
          try {
            // Analizar ingredientes
            if (recipe.ingredients) {
              const ingredients = JSON.parse(recipe.ingredients);
              ingredients.forEach((ing: { name: string }) => {
                analyzedIngredients.add(ing.name.toLowerCase());
              });
            }

            // Analizar títulos
            analyzedTitles.add(recipe.title.toLowerCase());

            // Analizar métodos de cocción (extraer de instrucciones)
            const instructions = recipe.instructions.toLowerCase();
            if (instructions.includes('hornea') || instructions.includes('horno')) {
              analyzedMethods.add('horneado');
            }
            if (instructions.includes('sartén') || instructions.includes('plancha')) {
              analyzedMethods.add('plancha');
            }
            if (instructions.includes('hervido') || instructions.includes('hervir')) {
              analyzedMethods.add('hervido');
            }
            if (instructions.includes('salteado') || instructions.includes('saltear')) {
              analyzedMethods.add('salteado');
            }

            console.log(`🔍 DEBUG: Receta analizada: "${recipe.title}"`);
          } catch (error) {
            console.warn("⚠️ DEBUG: Error analizando receta:", error);
          }
        }

        // Crear contexto para la IA
        existingRecipesContext = `

CONTEXTO DE RECETAS EXISTENTES:
- Ingredientes ya usados recientemente: ${Array.from(analyzedIngredients).join(", ")}
- Títulos ya usados: ${Array.from(analyzedTitles).join(", ")}
- Métodos de cocción ya usados: ${Array.from(analyzedMethods).join(", ")}

INSTRUCCIONES PARA EVITAR REPETICIÓN:
- NO uses los ingredientes ya listados arriba
- NO uses títulos similares a los ya listados
- Varía los métodos de cocción (evita: ${Array.from(analyzedMethods).join(", ")})
- Crea una receta completamente diferente y única`;

        console.log("🔍 DEBUG: Contexto de recetas existentes creado:", existingRecipesContext);
      }
    } catch (error) {
      console.error("❌ DEBUG: Error analizando recetas existentes:", error);
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Intento ${attempt}/${maxRetries} para generar receta de ${mealType}`
      );

      // Formatear SOLO los ingredientes preseleccionados
      const preselectedInventoryText = preselectedIngredients
        .map((item) => {
          const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
          return `${item.name}: ${item.quantity} ${unitAbbr}`;
        })
        .join(", ");

      const mealTypeLabel = MEAL_TYPE_LABELS[mealType];

      let prompt = `Necesito que me crees una receta para ${mealTypeLabel.toLowerCase()} utilizando ÚNICAMENTE estos ingredientes preseleccionados:

${preselectedInventoryText}

IMPORTANTE: Solo puedes usar los ingredientes listados arriba. NO uses otros ingredientes del inventario.

${customTitle ? `TÍTULO SUGERIDO: ${customTitle}` : ""}
${customDescription ? `DESCRIPCIÓN SUGERIDA: ${customDescription}` : ""}
${
  preferredIngredients && preferredIngredients.length > 0
    ? `INGREDIENTES PREFERIDOS A INCLUIR: ${preferredIngredients.join(", ")}`
    : ""
}

${existingRecipesContext}

REGLAS ESPECÍFICAS PARA ${mealTypeLabel.toUpperCase()}:
${mealType === 'BREAKFAST' ? `
- INGREDIENTES TÍPICOS: huevos, pan, lácteos, cereales, frutas
- ESTILO: Simple, rápido, energético
- EJEMPLOS: "Huevos Revueltos", "Tostadas con Mermelada", "Café con Leche"
` : mealType === 'LUNCH' ? `
- INGREDIENTES TÍPICOS: carnes, verduras, arroz, pasta, ensaladas
- ESTILO: Sustancioso, balanceado, nutritivo
- EJEMPLOS: "Milanesa con Puré", "Pollo Asado", "Ensalada Mixta"
` : mealType === 'SNACK' ? `
- INGREDIENTES TÍPICOS: frutas, yogur, galletas, té, café
- ESTILO: Ligero, refrescante, energético
- EJEMPLOS: "Yogur con Frutas", "Té con Galletas", "Mate con Bizcochitos"
` : `
- INGREDIENTES TÍPICOS: pescado, verduras, sopas, pastas ligeras
- ESTILO: Ligero, digestivo, relajante
- EJEMPLOS: "Sopa de Verduras", "Pescado al Horno", "Ensalada César"
`}

REGLAS GENERALES:
- Título simple y directo (máximo 4 palabras)
- Solo 3-4 ingredientes principales
- Tiempo de cocción: 15-25 minutos
- Dificultad: Fácil
- Instrucciones claras en 4 pasos máximo
- Usa SOLO los ingredientes preseleccionados arriba

IMPORTANTE: Crea una receta única y diferente a las recetas existentes mencionadas arriba.`;

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
${
  preferredIngredients && preferredIngredients.length > 0
    ? "- PRIORIZA especialmente los ingredientes preferidos mencionados arriba"
    : ""
}
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

      prompt += `\n\nIMPORTANTE: 
- El campo "instructions" debe ser un STRING, no un array. Separa los pasos con \\n\\n para mejor formato.
- El campo "suggestedIngredients" debe ser un array de strings con ingredientes adicionales sugeridos.`;

      // Preparar el contenido para el modelo
      const content: (string | unknown)[] = [prompt];

      // Si hay imagen, agregarla al contenido
      if (image) {
        try {
          const imagePart = await fileToGenerativePart(image);
          content.push(imagePart);
        } catch (error) {
          console.error("Error procesando imagen:", error);
          // Continuar sin imagen si hay error
        }
      }

      const result = await generateText({
        model: model,
        prompt: prompt,
      });

      // Parsear la respuesta del modelo local
      const recipeData = parseModelResponse(result.text);

      // Verificar que recipeData es un objeto
      if (typeof recipeData !== 'object' || recipeData === null) {
        throw new Error('Datos de receta inválidos');
      }

      const data = recipeData as Record<string, unknown>;

      // Convertir instrucciones de array a string si es necesario
      let instructions = data.instructions;
      if (Array.isArray(instructions)) {
        instructions = instructions.join("\n\n");
      }

      console.log(
        `✅ Receta generada exitosamente en intento ${attempt} para ${mealType}`
      );
      return {
        title: data.title as string,
        description: data.description as string,
        instructions: instructions as string,
        cookingTime: (data.cookingTime as number) || 30, // Valor por defecto si es undefined
        difficulty: (data.difficulty as string) || "Fácil", // Valor por defecto si es undefined
        servings: (data.servings as number) || 4, // Valor por defecto si es undefined
        suggestedIngredients: (data.suggestedIngredients as string[]) || [],
      };
    } catch (error) {
      console.error(
        `❌ Error en intento ${attempt}/${maxRetries} para ${mealType}:`,
        error
      );

      // Verificar si es un error de sobrecarga (503) o rate limiting
      const isOverloadError =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("overloaded") ||
          error.message.includes("Service Unavailable") ||
          error.message.includes("rate limit"));

      // Si es el último intento o no es un error de sobrecarga, lanzar el error
      if (attempt === maxRetries || !isOverloadError) {
        // Log más detallado del error
        if (error instanceof Error) {
          console.error("LM Studio error message:", error.message);
          console.error("LM Studio error stack:", error.stack);
        }

        // Verificar si es un error de conexión
        if (
          error instanceof Error &&
          (error.message.includes("fetch") || error.message.includes("network"))
        ) {
          throw new Error(
            "Error de conexión. Verifica que LM Studio esté ejecutándose en http://127.0.0.1:1234"
          );
        }

        throw new Error(
          `Error al generar la receta: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }

      // Si es un error de sobrecarga y no es el último intento, esperar y reintentar
      if (isOverloadError) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(
          `⏳ API sobrecargada. Esperando ${delay}ms antes del siguiente intento...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(
    `No se pudo generar la receta después de ${maxRetries} intentos. El modelo local está sobrecargado.`
  );
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
  // Formatear inventario actual
  const inventoryText = currentInventory
    .map((item) => {
      const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
      return `${item.name}: ${item.quantity} ${unitAbbr}`;
    })
    .join(", ");

  const prompt = `Eres un experto en análisis de imágenes de alimentos. Analiza DETALLADAMENTE la imagen proporcionada y identifica todos los ingredientes/alimentos que puedas ver.

INVENTARIO ACTUAL DEL USUARIO: ${inventoryText}

INSTRUCCIONES ESPECÍFICAS:
1. MIRA CUIDADOSAMENTE la imagen y identifica CADA ingrediente/alimento visible
2. Estima las cantidades reales que ves en la imagen (no uses cantidades genéricas)
3. Compara con el inventario actual para determinar qué ya tiene el usuario
4. Identifica ingredientes NUEVOS que no están en su inventario
5. Sugiere ingredientes básicos que podrían faltar para cocinar

IMPORTANTE: Analiza la imagen REAL, no uses ingredientes genéricos. Si la imagen muestra frutas, identifica las frutas específicas. Si muestra verduras, identifica las verduras específicas.

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

REGLAS IMPORTANTES:
- NO uses ingredientes genéricos como "Tomates", "Cebollas", "Ajo" si no están realmente en la imagen
- Analiza SOLO lo que realmente ves en la imagen
- Si la imagen está vacía o no muestra alimentos, devuelve arrays vacíos
- Usa solo las unidades: PIECE, GRAM, KILOGRAM, LITER, MILLILITER, CUP, TABLESPOON, TEASPOON, POUND, OUNCE
- Usa solo las categorías: VEGETABLE, FRUIT, MEAT, DAIRY, GRAIN, LIQUID, SPICE, OTHER
- confidence debe ser un número entre 0 y 1
- quantity debe ser un número positivo
- Responde en español

EJEMPLO DE ANÁLISIS CORRECTO:
- Si ves manzanas rojas en la imagen → "Manzanas rojas"
- Si ves zanahorias → "Zanahorias"
- Si ves pollo → "Pollo"
- NO uses ingredientes que no estén visibles en la imagen`;

  try {
    // Preparar el contenido para el modelo
    let content: unknown;
    
    if (image) {
      try {
        console.log("Procesando imagen...");
        let imagePart;
        if (typeof window === "undefined" || image instanceof Buffer) {
          // En el servidor, usar buffer
          const buffer =
            image instanceof Buffer
              ? image
              : Buffer.from(await (image as File).arrayBuffer());
          imagePart = bufferToGenerativePart(buffer, mimeType || "image/jpeg");
        } else {
          // En el cliente, usar File
          imagePart = await fileToGenerativePart(image as File);
        }
        
        // Formato correcto para el AI SDK - usar messages en lugar de prompt
        content = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              imagePart
            ]
          }
        ];
        
        console.log("Contenido con imagen preparado:", {
          hasImage: true,
          promptLength: prompt.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          imageType: (imagePart as any).type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          imageMimeType: (imagePart as any).mimeType
        });
      } catch (error) {
        console.error("Error procesando imagen:", error);
        // Continuar sin imagen si hay error
        content = prompt;
      }
    } else {
      content = prompt;
      console.log("Sin imagen, usando solo texto");
    }

    console.log("Enviando contenido al modelo...");
    console.log("Tipo de contenido:", typeof content);
    console.log("Es array:", Array.isArray(content));
    if (Array.isArray(content)) {
      console.log("Longitud del array:", content.length);
      console.log("Primer elemento:", typeof content[0]);
      console.log("Segundo elemento:", content[1] ? typeof content[1] : "none");
    }
    
    let result;
    try {
      // Usar messages si es un array con role, sino usar prompt
      if (Array.isArray(content) && content[0]?.role) {
        result = await generateText({
          model: model,
          messages: content as ModelMessage[],
        });
      } else {
        result = await generateText({
          model: model,
          prompt: content as string,
        });
      }
      console.log("Llamada al modelo exitosa");
    } catch (error) {
      console.error("Error en generateText:", error);
      throw error;
    }

    // Parsear la respuesta del modelo local
    const analysisData = parseModelResponse(result.text);

    console.log("Respuesta de LM Studio:", analysisData);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detectedIngredients: (analysisData as any).detectedIngredients || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      missingIngredients: (analysisData as any).missingIngredients || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suggestions: (analysisData as any).suggestions || [],
    };
  } catch (error) {
    console.error("Error analizando imagen:", error);
    throw new Error(
      "Error al analizar la imagen. Por favor, intenta de nuevo."
    );
  }
}

// Función para generar plan de comidas
export async function generateMealPlan(
  inventory: InventoryIngredient[],
  days: number,
  startDate: Date
): Promise<MealPlan[]> {
  // Formatear inventario
  const inventoryText = inventory
    .map((item) => {
      const unitAbbr = FOOD_UNIT_ABBREVIATIONS[item.unit];
      return `${item.name}: ${item.quantity} ${unitAbbr}`;
    })
    .join(", ");

  // Generar fechas
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  const prompt = `Genera un plan de comidas para ${days} días usando estos ingredientes disponibles:

INVENTARIO: ${inventoryText}

FECHAS: ${dates.join(", ")}

Por favor, crea un plan de comidas que incluya:
- Desayuno, almuerzo, merienda y cena para cada día
- Recetas que usen principalmente los ingredientes disponibles
- Variedad en los platos a lo largo de los días
- Considera el balance nutricional

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
    console.log("🚀 DEBUG: Generando plan de comidas con prompt:", prompt.substring(0, 200) + "...");
    
    const result = await generateText({
      model: model,
      prompt: prompt,
    });

    console.log("🔍 DEBUG: Respuesta del modelo:", result.text.substring(0, 500) + "...");

    // Parsear la respuesta del modelo local
    const planData = parseModelResponse(result.text);

    console.log("🔍 DEBUG: Plan data parseado:", planData);

    // Verificar que planData es un objeto
    if (typeof planData !== 'object' || planData === null) {
      console.error("❌ DEBUG: planData no es un objeto válido:", planData);
      throw new Error('Datos de plan de comidas inválidos');
    }

    const data = planData as Record<string, unknown>;

    console.log("🔍 DEBUG: Data extraído:", data);
    console.log("🔍 DEBUG: mealPlan en data:", data.mealPlan);

    const mealPlan = (data.mealPlan as MealPlan[]) || [];
    console.log("✅ DEBUG: Plan de comidas final:", mealPlan);

    return mealPlan;
  } catch (error) {
    console.error("Error generando plan de comidas:", error);
    if (error instanceof SyntaxError) {
      console.error("Error de parsing JSON:", error.message);
    }
    throw new Error(
      "Error al generar el plan de comidas. Por favor, intenta de nuevo."
    );
  }
}
