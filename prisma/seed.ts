import { PrismaClient } from '../src/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Ingredientes completos con categorías, unidades e iconos
const ingredients = [
  // VEGETALES
  {
    name: 'Tomate',
    description: 'Fruto rojo y jugoso, perfecto para ensaladas y salsas',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🍅'
  },
  {
    name: 'Cebolla',
    description: 'Bulbo aromático, base de muchos platos',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🧅'
  },
  {
    name: 'Ajo',
    description: 'Condimento esencial con sabor intenso',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🧄'
  },
  {
    name: 'Pimiento Rojo',
    description: 'Verdura colorida y dulce, rica en vitaminas',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🫑'
  },
  {
    name: 'Pimiento Verde',
    description: 'Verdura fresca y crujiente',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🫑'
  },
  {
    name: 'Zanahoria',
    description: 'Raíz naranja, dulce y crujiente',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥕'
  },
  {
    name: 'Papa',
    description: 'Tubérculo versátil, base de muchos platos',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥔'
  },
  {
    name: 'Lechuga',
    description: 'Hoja verde fresca, perfecta para ensaladas',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥬'
  },
  {
    name: 'Pepino',
    description: 'Verdura refrescante y acuosa',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥒'
  },
  {
    name: 'Brócoli',
    description: 'Verdura verde rica en nutrientes',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥦'
  },
  {
    name: 'Coliflor',
    description: 'Verdura blanca versátil y saludable',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥬'
  },
  {
    name: 'Espinaca',
    description: 'Hoja verde rica en hierro',
    category: 'VEGETABLE' as const,
    unit: 'GRAM' as const,
    icon: '🥬'
  },
  {
    name: 'Apio',
    description: 'Tallo crujiente y refrescante',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥬'
  },
  {
    name: 'Perejil',
    description: 'Hierba aromática fresca',
    category: 'VEGETABLE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Cilantro',
    description: 'Hierba aromática con sabor único',
    category: 'VEGETABLE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Albahaca',
    description: 'Hierba aromática para pesto y ensaladas',
    category: 'VEGETABLE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Orégano',
    description: 'Hierba seca aromática',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Tomillo',
    description: 'Hierba aromática para carnes',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Romero',
    description: 'Hierba aromática para asados',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🌿'
  },
  {
    name: 'Champiñones',
    description: 'Hongos versátiles y sabrosos',
    category: 'VEGETABLE' as const,
    unit: 'GRAM' as const,
    icon: '🍄'
  },
  {
    name: 'Portobello',
    description: 'Hongos grandes y carnosos',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🍄'
  },
  {
    name: 'Calabacín',
    description: 'Verdura verde suave y versátil',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥒'
  },
  {
    name: 'Berenjena',
    description: 'Verdura morada versátil',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🍆'
  },
  {
    name: 'Remolacha',
    description: 'Raíz roja dulce y nutritiva',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥕'
  },
  {
    name: 'Rábano',
    description: 'Raíz picante y crujiente',
    category: 'VEGETABLE' as const,
    unit: 'PIECE' as const,
    icon: '🥕'
  },

  // FRUTAS
  {
    name: 'Manzana',
    description: 'Fruta dulce y crujiente',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍎'
  },
  {
    name: 'Plátano',
    description: 'Fruta dulce y energética',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍌'
  },
  {
    name: 'Naranja',
    description: 'Cítrico jugoso y rico en vitamina C',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍊'
  },
  {
    name: 'Limón',
    description: 'Cítrico ácido para aderezar',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍋'
  },
  {
    name: 'Lima',
    description: 'Cítrico verde y refrescante',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍋'
  },
  {
    name: 'Fresa',
    description: 'Fruta roja dulce y aromática',
    category: 'FRUIT' as const,
    unit: 'GRAM' as const,
    icon: '🍓'
  },
  {
    name: 'Arándanos',
    description: 'Frutos pequeños y antioxidantes',
    category: 'FRUIT' as const,
    unit: 'GRAM' as const,
    icon: '🫐'
  },
  {
    name: 'Uvas',
    description: 'Frutos dulces en racimos',
    category: 'FRUIT' as const,
    unit: 'GRAM' as const,
    icon: '🍇'
  },
  {
    name: 'Piña',
    description: 'Fruta tropical dulce y jugosa',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍍'
  },
  {
    name: 'Mango',
    description: 'Fruta tropical dulce y cremosa',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🥭'
  },
  {
    name: 'Aguacate',
    description: 'Fruta cremosa rica en grasas saludables',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🥑'
  },
  {
    name: 'Pera',
    description: 'Fruta dulce y jugosa',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍐'
  },
  {
    name: 'Durazno',
    description: 'Fruta dulce y aromática',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍑'
  },
  {
    name: 'Kiwi',
    description: 'Fruta verde ácida y nutritiva',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🥝'
  },
  {
    name: 'Granada',
    description: 'Fruta con semillas rojas dulces',
    category: 'FRUIT' as const,
    unit: 'PIECE' as const,
    icon: '🍎'
  },

  // CARNES
  {
    name: 'Pollo',
    description: 'Carne blanca versátil y saludable',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🍗'
  },
  {
    name: 'Carne de Res',
    description: 'Carne roja rica en proteínas',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🥩'
  },
  {
    name: 'Cerdo',
    description: 'Carne versátil y sabrosa',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🥩'
  },
  {
    name: 'Cordero',
    description: 'Carne tierna y aromática',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🥩'
  },
  {
    name: 'Pavo',
    description: 'Carne blanca magra y saludable',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🦃'
  },
  {
    name: 'Jamón',
    description: 'Carne curada y salada',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🥓'
  },
  {
    name: 'Tocino',
    description: 'Carne curada y ahumada',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🥓'
  },
  {
    name: 'Salchichas',
    description: 'Embutidos versátiles',
    category: 'MEAT' as const,
    unit: 'PIECE' as const,
    icon: '🌭'
  },
  {
    name: 'Chorizo',
    description: 'Embutido picante y sabroso',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🌭'
  },

  // PESCADOS Y MARISCOS
  {
    name: 'Salmón',
    description: 'Pescado graso rico en omega-3',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🐟'
  },
  {
    name: 'Atún',
    description: 'Pescado magro y versátil',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🐟'
  },
  {
    name: 'Bacalao',
    description: 'Pescado blanco y firme',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🐟'
  },
  {
    name: 'Camarones',
    description: 'Mariscos dulces y versátiles',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🦐'
  },
  {
    name: 'Langostinos',
    description: 'Mariscos grandes y sabrosos',
    category: 'MEAT' as const,
    unit: 'PIECE' as const,
    icon: '🦐'
  },
  {
    name: 'Mejillones',
    description: 'Moluscos sabrosos y nutritivos',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🦪'
  },
  {
    name: 'Almejas',
    description: 'Moluscos dulces y tiernos',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🦪'
  },
  {
    name: 'Pulpo',
    description: 'Marisco tierno y sabroso',
    category: 'MEAT' as const,
    unit: 'GRAM' as const,
    icon: '🐙'
  },

  // LÁCTEOS
  {
    name: 'Leche',
    description: 'Bebida láctea nutritiva',
    category: 'DAIRY' as const,
    unit: 'LITER' as const,
    icon: '🥛'
  },
  {
    name: 'Queso Cheddar',
    description: 'Queso amarillo y sabroso',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧀'
  },
  {
    name: 'Queso Mozzarella',
    description: 'Queso blanco y elástico',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧀'
  },
  {
    name: 'Queso Parmesano',
    description: 'Queso duro y aromático',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧀'
  },
  {
    name: 'Queso Feta',
    description: 'Queso griego salado',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧀'
  },
  {
    name: 'Queso Ricotta',
    description: 'Queso fresco y cremoso',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧀'
  },
  {
    name: 'Yogur',
    description: 'Lácteo fermentado y probiótico',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🥛'
  },
  {
    name: 'Mantequilla',
    description: 'Grasa láctea para cocinar',
    category: 'DAIRY' as const,
    unit: 'GRAM' as const,
    icon: '🧈'
  },
  {
    name: 'Crema',
    description: 'Lácteo rico para salsas',
    category: 'DAIRY' as const,
    unit: 'MILLILITER' as const,
    icon: '🥛'
  },
  {
    name: 'Huevos',
    description: 'Proteína versátil y nutritiva',
    category: 'DAIRY' as const,
    unit: 'PIECE' as const,
    icon: '🥚'
  },

  // GRANOS Y CEREALES
  {
    name: 'Arroz',
    description: 'Cereal básico y versátil',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🍚'
  },
  {
    name: 'Pasta',
    description: 'Pasta italiana versátil',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🍝'
  },
  {
    name: 'Quinoa',
    description: 'Pseudo-cereal rico en proteínas',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🌾'
  },
  {
    name: 'Avena',
    description: 'Cereal integral y nutritivo',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🌾'
  },
  {
    name: 'Trigo',
    description: 'Cereal para harinas',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🌾'
  },
  {
    name: 'Cebada',
    description: 'Cereal para sopas y guisos',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🌾'
  },
  {
    name: 'Lentejas',
    description: 'Legumbre rica en proteínas',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🫘'
  },
  {
    name: 'Garbanzos',
    description: 'Legumbre versátil y nutritiva',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🫘'
  },
  {
    name: 'Frijoles Negros',
    description: 'Legumbre rica en fibra',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🫘'
  },
  {
    name: 'Frijoles Rojos',
    description: 'Legumbre para chilis y guisos',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🫘'
  },
  {
    name: 'Alubias',
    description: 'Legumbre blanca y suave',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🫘'
  },
  {
    name: 'Pan',
    description: 'Producto horneado básico',
    category: 'GRAIN' as const,
    unit: 'PIECE' as const,
    icon: '🍞'
  },
  {
    name: 'Harina',
    description: 'Polvo para hornear y cocinar',
    category: 'GRAIN' as const,
    unit: 'GRAM' as const,
    icon: '🌾'
  },

  // FRUTOS SECOS Y SEMILLAS
  {
    name: 'Almendras',
    description: 'Fruto seco rico en vitamina E',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🥜'
  },
  {
    name: 'Nueces',
    description: 'Fruto seco rico en omega-3',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🥜'
  },
  {
    name: 'Avellanas',
    description: 'Fruto seco dulce y cremoso',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🥜'
  },
  {
    name: 'Pistachos',
    description: 'Fruto seco verde y sabroso',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🥜'
  },
  {
    name: 'Semillas de Chía',
    description: 'Superalimento rico en omega-3',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🌰'
  },
  {
    name: 'Semillas de Girasol',
    description: 'Semillas ricas en vitamina E',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🌰'
  },
  {
    name: 'Semillas de Sésamo',
    description: 'Semillas aromáticas y nutritivas',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🌰'
  },
  {
    name: 'Coco',
    description: 'Fruto tropical versátil',
    category: 'FRUIT' as const,
    unit: 'GRAM' as const,
    icon: '🥥'
  },

  // CONDIMENTOS Y ESPECIAS
  {
    name: 'Sal',
    description: 'Condimento básico para realzar sabores',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🧂'
  },
  {
    name: 'Pimienta Negra',
    description: 'Especia picante y aromática',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Pimienta Roja',
    description: 'Especia picante y colorida',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Canela',
    description: 'Especia dulce y aromática',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Jengibre',
    description: 'Raíz picante y aromática',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Ajo en Polvo',
    description: 'Condimento seco y concentrado',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🧄'
  },
  {
    name: 'Cúrcuma',
    description: 'Especia dorada y antiinflamatoria',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Comino',
    description: 'Especia aromática para carnes',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Pimentón',
    description: 'Especia roja y dulce',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Laurel',
    description: 'Hoja aromática para guisos',
    category: 'SPICE' as const,
    unit: 'PIECE' as const,
    icon: '🌿'
  },
  {
    name: 'Clavo',
    description: 'Especia aromática y dulce',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },
  {
    name: 'Nuez Moscada',
    description: 'Especia dulce y aromática',
    category: 'SPICE' as const,
    unit: 'GRAM' as const,
    icon: '🫚'
  },

  // LÍQUIDOS
  {
    name: 'Aceite de Oliva',
    description: 'Aceite saludable para cocinar',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🫒'
  },
  {
    name: 'Aceite de Girasol',
    description: 'Aceite neutro para freír',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🫒'
  },
  {
    name: 'Vinagre',
    description: 'Líquido ácido para aderezos',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍶'
  },
  {
    name: 'Vino Tinto',
    description: 'Bebida alcohólica para cocinar',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍷'
  },
  {
    name: 'Vino Blanco',
    description: 'Bebida alcohólica para salsas',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍷'
  },
  {
    name: 'Caldo de Pollo',
    description: 'Base líquida para sopas',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍲'
  },
  {
    name: 'Caldo de Verduras',
    description: 'Base líquida vegetal',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍲'
  },
  {
    name: 'Salsa de Soja',
    description: 'Condimento salado asiático',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍶'
  },
  {
    name: 'Salsa de Tomate',
    description: 'Base para pizzas y pastas',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍅'
  },
  {
    name: 'Miel',
    description: 'Endulzante natural y saludable',
    category: 'LIQUID' as const,
    unit: 'MILLILITER' as const,
    icon: '🍯'
  },
  {
    name: 'Azúcar',
    description: 'Endulzante básico',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🍯'
  },
  {
    name: 'Cacao en Polvo',
    description: 'Polvo de chocolate para postres',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🍫'
  },
  {
    name: 'Chocolate Negro',
    description: 'Chocolate puro para postres',
    category: 'OTHER' as const,
    unit: 'GRAM' as const,
    icon: '🍫'
  },
  {
    name: 'Café',
    description: 'Bebida energética y aromática',
    category: 'LIQUID' as const,
    unit: 'GRAM' as const,
    icon: '☕'
  },
  {
    name: 'Té',
    description: 'Bebida aromática y relajante',
    category: 'LIQUID' as const,
    unit: 'GRAM' as const,
    icon: '🍵'
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
  await prisma.userIngredientInventory.deleteMany();
  await prisma.mealCalendar.deleteMany();
  await prisma.userFoodPreference.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.food.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Datos anteriores eliminados');

  // Insertar ingredientes
  console.log('🥬 Insertando ingredientes...');
  for (const ingredient of ingredients) {
    await prisma.food.create({
      data: {
        ...ingredient,
        image: (ingredient as any).image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
      }
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
  console.log(`📊 Ingredientes creados: ${ingredients.length}`);
  console.log('📧 Usuarios creados:');
  console.log('   - demo@cookify.com (contraseña: demo123)');
  console.log('   - admin@cookify.com (contraseña: admin123)');
  console.log('🎉 ¡Base de datos lista para usar!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
