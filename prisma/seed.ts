import { PrismaClient } from '../src/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const vegetables = [
  {
    name: 'Tomate',
    description: 'Fruto rojo y jugoso, perfecto para ensaladas y salsas',
    image: 'https://images.unsplash.com/photo-1546470427-5c4b2b5b5b5b?w=400'
  },
  {
    name: 'Cebolla',
    description: 'Bulbo aromático, base de muchos platos',
    image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400'
  },
  {
    name: 'Ajo',
    description: 'Condimento esencial con sabor intenso',
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400'
  },
  {
    name: 'Pimiento',
    description: 'Verdura colorida y dulce, rica en vitaminas',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'
  },
  {
    name: 'Zanahoria',
    description: 'Raíz naranja, dulce y crujiente',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'
  },
  {
    name: 'Papa',
    description: 'Tubérculo versátil, base de muchos platos',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'
  },
  {
    name: 'Lechuga',
    description: 'Hoja verde fresca, perfecta para ensaladas',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'
  },
  {
    name: 'Pepino',
    description: 'Verdura refrescante y acuosa',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400'
  }
];

const users = [
  {
    name: 'Usuario Demo',
    email: 'demo@cookify.com',
    password: 'demo123',
    role: 'USER' as const
  },
  {
    name: 'Admin Demo',
    email: 'admin@cookify.com',
    password: 'admin123',
    role: 'ADMIN' as const
  }
];

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.userFoodPreference.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.food.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Datos anteriores eliminados');

  // Insertar verduras
  console.log('🥬 Insertando verduras...');
  for (const vegetable of vegetables) {
    await prisma.food.create({
      data: vegetable
    });
  }

  // Crear usuarios
  console.log('👥 Creando usuarios...');
  for (const user of users) {
    const hashedPassword = await hash(user.password, 12);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role
      }
    });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('📧 Usuarios creados:');
  console.log('   - demo@cookify.com (contraseña: demo123)');
  console.log('   - admin@cookify.com (contraseña: admin123)');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
