// Sistema de cache simple para recetas
interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  cookingTime: number | null;
  difficulty: string | null;
  servings: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CachedRecipe {
  recipe: Recipe;
  timestamp: number;
  ingredients: string[];
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const cache = new Map<string, CachedRecipe>();

export function getCachedRecipe(ingredients: string[]): Recipe | null {
  const key = ingredients.sort().join(',');
  const cached = cache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Receta encontrada en cache');
    return cached.recipe;
  }
  
  return null;
}

export function setCachedRecipe(ingredients: string[], recipe: Recipe): void {
  const key = ingredients.sort().join(',');
  cache.set(key, {
    recipe,
    timestamp: Date.now(),
    ingredients
  });
  console.log('💾 Receta guardada en cache');
}

export function clearCache(): void {
  cache.clear();
  console.log('🗑️ Cache limpiado');
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
