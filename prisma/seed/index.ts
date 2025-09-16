// Exportar todos los datos de seed
export { vegetables } from './data/vegetables';

// Exportar utilidades
export { SeedUtils } from './utils/seedUtils';

// Exportar tipos si es necesario
export type VegetableData = {
  name: string;
  description: string;
  image: string;
};
