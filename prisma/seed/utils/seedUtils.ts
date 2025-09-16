import { PrismaClient } from '../../src/generated/prisma';

export class SeedUtils {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Limpia todos los datos de la tabla Food
   */
  async clearFoodData(): Promise<void> {
    console.log('🧹 Limpiando datos existentes...');
    await this.prisma.food.deleteMany({});
    console.log('✅ Datos existentes eliminados');
  }

  /**
   * Inserta un array de datos en la tabla Food
   */
  async insertFoodData(data: Array<{ name: string; description: string; image: string }>): Promise<void> {
    console.log(`🌱 Insertando ${data.length} elementos...`);
    
    for (const item of data) {
      await this.prisma.food.create({
        data: item
      });
    }
    
    console.log(`✅ ${data.length} elementos insertados exitosamente`);
  }

  /**
   * Ejecuta el seed completo con manejo de errores
   */
  async runSeed(seedFunction: () => Promise<void>): Promise<void> {
    try {
      await seedFunction();
      console.log('🎉 Seed completado exitosamente!');
    } catch (error) {
      console.error('❌ Error durante el seed:', error);
      throw error;
    }
  }

  /**
   * Cierra la conexión de Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
