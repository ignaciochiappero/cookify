import { PrismaClient } from '../src/generated/prisma';
import { vegetables } from './seed/data/vegetables';
import { SeedUtils } from './seed/utils/seedUtils';

const prisma = new PrismaClient();
const seedUtils = new SeedUtils(prisma);

async function main() {
  console.log('🌱 Iniciando seed de verduras...');
  
  await seedUtils.runSeed(async () => {
    // Limpiar datos existentes
    await seedUtils.clearFoodData();
    
    // Insertar verduras
    await seedUtils.insertFoodData(vegetables);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await seedUtils.disconnect();
  });
