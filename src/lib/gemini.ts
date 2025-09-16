import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecipeIngredient, GeneratedRecipe } from '@/types/recipe';

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
