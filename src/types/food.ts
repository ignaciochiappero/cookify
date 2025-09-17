export interface Food {
  id: string;
  name: string;
  description: string;
  image: string;
  icon?: string;
  category: 'VEGETABLE' | 'FRUIT' | 'MEAT' | 'DAIRY' | 'GRAIN' | 'LIQUID' | 'SPICE' | 'OTHER';
  unit: 'PIECE' | 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'CUP' | 'TABLESPOON' | 'TEASPOON' | 'POUND' | 'OUNCE';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}
