import { z } from 'zod';

export const foodSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(200, 'La descripción no puede exceder 200 caracteres')
    .trim(),
  image: z.string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal(''))
});

export type FoodFormData = z.infer<typeof foodSchema>;
