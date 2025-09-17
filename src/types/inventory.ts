export interface IngredientInventory {
  id: string;
  userId: string;
  foodId: string;
  quantity: number;
  unit: FoodUnit;
  expirationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  food: {
    id: string;
    name: string;
    description: string;
    image: string;
    category: FoodCategory;
    unit: FoodUnit;
  };
}

export interface CreateInventoryItem {
  foodId: string;
  quantity: number;
  unit: FoodUnit;
  expirationDate?: Date;
  notes?: string;
}

export interface UpdateInventoryItem {
  quantity?: number;
  unit?: FoodUnit;
  expirationDate?: Date;
  notes?: string;
}

export enum FoodCategory {
  VEGETABLE = 'VEGETABLE',
  FRUIT = 'FRUIT',
  MEAT = 'MEAT',
  DAIRY = 'DAIRY',
  GRAIN = 'GRAIN',
  LIQUID = 'LIQUID',
  SPICE = 'SPICE',
  OTHER = 'OTHER'
}

export enum FoodUnit {
  PIECE = 'PIECE',
  GRAM = 'GRAM',
  KILOGRAM = 'KILOGRAM',
  LITER = 'LITER',
  MILLILITER = 'MILLILITER',
  CUP = 'CUP',
  TABLESPOON = 'TABLESPOON',
  TEASPOON = 'TEASPOON',
  POUND = 'POUND',
  OUNCE = 'OUNCE'
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  [FoodCategory.VEGETABLE]: 'Verdura',
  [FoodCategory.FRUIT]: 'Fruta',
  [FoodCategory.MEAT]: 'Carne',
  [FoodCategory.DAIRY]: 'Lácteo',
  [FoodCategory.GRAIN]: 'Cereal/Grano',
  [FoodCategory.LIQUID]: 'Líquido',
  [FoodCategory.SPICE]: 'Especia',
  [FoodCategory.OTHER]: 'Otro'
};

export const FOOD_UNIT_LABELS: Record<FoodUnit, string> = {
  [FoodUnit.PIECE]: 'Unidad',
  [FoodUnit.GRAM]: 'Gramos',
  [FoodUnit.KILOGRAM]: 'Kilogramos',
  [FoodUnit.LITER]: 'Litros',
  [FoodUnit.MILLILITER]: 'Mililitros',
  [FoodUnit.CUP]: 'Taza',
  [FoodUnit.TABLESPOON]: 'Cucharada',
  [FoodUnit.TEASPOON]: 'Cucharadita',
  [FoodUnit.POUND]: 'Libras',
  [FoodUnit.OUNCE]: 'Onzas'
};

export const FOOD_UNIT_ABBREVIATIONS: Record<FoodUnit, string> = {
  [FoodUnit.PIECE]: 'un',
  [FoodUnit.GRAM]: 'g',
  [FoodUnit.KILOGRAM]: 'kg',
  [FoodUnit.LITER]: 'L',
  [FoodUnit.MILLILITER]: 'ml',
  [FoodUnit.CUP]: 'taza',
  [FoodUnit.TABLESPOON]: 'cda',
  [FoodUnit.TEASPOON]: 'cdta',
  [FoodUnit.POUND]: 'lb',
  [FoodUnit.OUNCE]: 'oz'
};
