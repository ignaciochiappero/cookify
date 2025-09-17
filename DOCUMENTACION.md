# 🍳 Cookify - Sistema Completo de Planificación de Comidas con IA

## 📋 Resumen Ejecutivo

**Cookify** es una aplicación web moderna construida con Next.js 15 que permite a los usuarios gestionar su inventario de ingredientes, planificar comidas en un calendario, y generar recetas personalizadas utilizando la API de Google Gemini. La aplicación incluye un sistema completo de autenticación, gestión de inventario con cantidades y unidades, calendario de comidas, y generación inteligente de recetas basada en ingredientes disponibles.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 15.5.3 con App Router
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js v4
- **IA**: Google Gemini 1.5 Flash
- **Estilos**: Tailwind CSS v4
- **Validación**: Zod + React Hook Form
- **Lenguaje**: TypeScript
- **Build**: Turbopack
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion

### Estructura del Proyecto
```
cookify/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── food/          # Gestión de alimentos
│   │   │   ├── inventory/     # Gestión de inventario
│   │   │   ├── meal-calendar/ # Calendario de comidas
│   │   │   ├── recipes/       # Gestión de recetas
│   │   │   └── user/          # Preferencias de usuario
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── meal-planner/      # Planificador de comidas
│   │   ├── recipes/           # Página de recetas
│   │   └── admin/             # Panel de administración
│   ├── components/            # Componentes React
│   │   ├── InventoryManager.tsx    # Gestión de inventario
│   │   ├── MealCalendar.tsx        # Calendario de comidas
│   │   ├── RecipeGenerator.tsx     # Generador de recetas
│   │   └── ...                    # Otros componentes
│   ├── lib/                   # Utilidades y configuración
│   ├── types/                 # Definiciones TypeScript
│   │   ├── inventory.ts       # Tipos de inventario
│   │   ├── meal-calendar.ts   # Tipos de calendario
│   │   └── ...                # Otros tipos
│   └── generated/             # Cliente Prisma generado
├── prisma/                    # Esquema y migraciones
└── public/                    # Archivos estáticos
```

## 🗄️ Modelo de Base de Datos

### Esquema Prisma
```prisma
// Usuarios del sistema
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  password      String
  role          UserRole  @default(USER)
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relaciones
  foodPreferences     UserFoodPreference[]
  ingredientInventory UserIngredientInventory[]
  recipes             Recipe[]
  mealCalendar        MealCalendar[]
  accounts            Account[]
  sessions            Session[]
}

// Alimentos/Ingredientes disponibles
model Food {
  id          String       @id @default(uuid())
  name        String
  description String
  image       String
  category    FoodCategory @default(VEGETABLE)
  unit        FoodUnit     @default(PIECE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relaciones
  userPreferences UserFoodPreference[]
  userInventory   UserIngredientInventory[]
}

// Preferencias de ingredientes por usuario
model UserFoodPreference {
  id          String   @id @default(uuid())
  userId      String
  foodId      String
  isAvailable Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  food Food @relation(fields: [foodId], references: [id], onDelete: Cascade)
  
  @@unique([userId, foodId])
}

// Inventario de ingredientes del usuario
model UserIngredientInventory {
  id             String     @id @default(uuid())
  userId         String
  foodId         String
  quantity       Float
  unit           FoodUnit
  expirationDate DateTime?
  notes          String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  
  // Relaciones
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  food Food @relation(fields: [foodId], references: [id], onDelete: Cascade)
  
  @@unique([userId, foodId])
}

// Calendario de comidas
model MealCalendar {
  id              String    @id @default(uuid())
  userId          String
  date            DateTime
  mealType        MealType
  recipeId        String?
  customMealName  String?
  isPlanned       Boolean   @default(false)
  isCompleted     Boolean   @default(false)
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relaciones
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe? @relation(fields: [recipeId], references: [id], onDelete: SetNull)
  
  @@unique([userId, date, mealType])
}

// Recetas generadas por IA
model Recipe {
  id           String   @id @default(uuid())
  title        String
  description  String
  ingredients  String   // JSON string de ingredientes
  instructions String
  cookingTime  Int?
  difficulty   String?
  servings     Int?
  userId       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relaciones
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  mealCalendar MealCalendar[]
}

// Enums
enum UserRole {
  USER
  ADMIN
}

enum FoodCategory {
  VEGETABLE
  FRUIT
  MEAT
  DAIRY
  GRAIN
  LIQUID
  SPICE
  OTHER
}

enum FoodUnit {
  PIECE
  GRAM
  KILOGRAM
  LITER
  MILLILITER
  CUP
  TABLESPOON
  TEASPOON
  POUND
  OUNCE
}

enum MealType {
  BREAKFAST
  LUNCH
  SNACK
  DINNER
}

// Modelos de NextAuth.js
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

## 🔐 Sistema de Autenticación

### Configuración NextAuth.js
- **Provider**: Credentials (email/password)
- **Estrategia**: JWT
- **Adapter**: Prisma Adapter
- **Páginas personalizadas**: `/auth/signin`, `/auth/signup`
- **Middleware**: Protección de rutas automática

### Roles de Usuario
- **USER**: Puede seleccionar ingredientes y generar recetas
- **ADMIN**: Puede agregar nuevos ingredientes al sistema

### Rutas Protegidas
- `/dashboard` - Requiere autenticación (selección de ingredientes)
- `/meal-planner` - Requiere autenticación (planificación de comidas)
- `/recipes` - Requiere autenticación (visualización de recetas)
- `/admin` - Requiere rol ADMIN (gestión de ingredientes)

## 🤖 Integración con IA (Google Gemini)

### Configuración
- **Modelo**: `gemini-1.5-flash`
- **API**: Google Generative AI SDK
- **Prompt**: Optimizado para generar recetas en español
- **Formato**: JSON estructurado

### Flujos de Generación

#### 1. Generación Básica (Dashboard)
1. Usuario selecciona ingredientes disponibles
2. Se envían los ingredientes a la API de Gemini
3. Gemini genera una receta completa con:
   - Título atractivo
   - Descripción breve
   - Instrucciones paso a paso
   - Tiempo de cocción
   - Nivel de dificultad
   - Número de porciones
4. La receta se guarda en la base de datos
5. Se muestra al usuario en la página de recetas

#### 2. Generación Avanzada (Meal Planner)
1. Usuario gestiona inventario con cantidades específicas
2. Selecciona tipo de comida (desayuno, almuerzo, merienda, cena)
3. Define número de porciones
4. Opcionalmente solicita sugerencias de ingredientes adicionales
5. Gemini genera receta considerando:
   - Cantidades exactas disponibles
   - Tipo de comida apropiado
   - Número de porciones solicitadas
   - Ingredientes adicionales sugeridos (si se solicita)
6. La receta se guarda y puede ser programada en el calendario

### Prompts de Gemini

#### Prompt Básico (Dashboard)
```
Necesito que me crees diferentes recetas utilizando estos ingredientes: [INGREDIENTES].

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
- Responde en español

Responde en formato JSON con la siguiente estructura:
{
  "title": "Título de la receta",
  "description": "Descripción breve",
  "instructions": "Instrucciones paso a paso detalladas. Separa cada paso con un salto de línea doble para mejor legibilidad.",
  "cookingTime": 30,
  "difficulty": "Fácil",
  "servings": 4
}
```

#### Prompt Avanzado (Meal Planner)
```
Necesito que me crees una receta para [TIPO_COMIDA] utilizando estos ingredientes disponibles en mi inventario:

[INVENTARIO_CON_CANTIDADES]

Por favor, genera UNA receta completa y detallada que incluya:

1. Título atractivo de la receta
2. Descripción breve (2-3 líneas)
3. Instrucciones paso a paso detalladas
4. Tiempo de cocción estimado en minutos
5. Nivel de dificultad (Fácil, Medio, Difícil)
6. Número de porciones
7. Lista de ingredientes necesarios con cantidades específicas

Requisitos:
- Usa principalmente los ingredientes disponibles en mi inventario
- Calcula las cantidades exactas necesarias para la receta
- Puedes sugerir ingredientes básicos adicionales (sal, aceite, especias comunes) si es necesario
- Las instrucciones deben ser claras y fáciles de seguir
- El tiempo de cocción debe ser realista
- Asegúrate de que la receta sea apropiada para [TIPO_COMIDA]
- Responde en español

[OPCIONAL: También sugiere ingredientes adicionales que podrían mejorar la receta o crear más variedad]

Responde en formato JSON con la siguiente estructura:
{
  "title": "Título de la receta",
  "description": "Descripción breve",
  "instructions": "Instrucciones paso a paso detalladas. Separa cada paso con \\n\\n para mejor formato.",
  "cookingTime": 30,
  "difficulty": "Fácil",
  "servings": 4,
  "suggestedIngredients": ["ingrediente1", "ingrediente2", "ingrediente3"]
}
```

## 🛠️ APIs Implementadas

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/signin` - Inicio de sesión
- `GET /api/auth/session` - Obtener sesión actual

### Alimentos
- `GET /api/food` - Obtener todos los alimentos
- `POST /api/food` - Crear nuevo alimento (solo ADMIN)
- `GET /api/food/[id]` - Obtener alimento específico
- `PUT /api/food/[id]` - Actualizar alimento (solo ADMIN)
- `DELETE /api/food/[id]` - Eliminar alimento (solo ADMIN)

### Inventario de Ingredientes
- `GET /api/inventory` - Obtener inventario del usuario
- `POST /api/inventory` - Agregar/actualizar item en inventario
- `GET /api/inventory/[id]` - Obtener item específico del inventario
- `PUT /api/inventory/[id]` - Actualizar item del inventario
- `DELETE /api/inventory/[id]` - Eliminar item del inventario

### Calendario de Comidas
- `GET /api/meal-calendar` - Obtener comidas programadas del usuario
- `POST /api/meal-calendar` - Programar nueva comida
- `GET /api/meal-calendar/[id]` - Obtener comida específica
- `PUT /api/meal-calendar/[id]` - Actualizar comida programada
- `DELETE /api/meal-calendar/[id]` - Eliminar comida programada

### Preferencias de Usuario
- `GET /api/user/preferences` - Obtener preferencias del usuario
- `POST /api/user/preferences` - Crear/actualizar preferencia

### Recetas
- `GET /api/recipes` - Obtener recetas del usuario
- `POST /api/recipes/generate` - Generar nueva receta con IA (básica)
- `POST /api/recipes/generate-from-inventory` - Generar receta desde inventario (avanzada)

## 🎨 Interfaz de Usuario

### Páginas Principales

#### 1. Página de Inicio (`/`)
- Landing page moderna y minimalista
- Información sobre la aplicación
- Estadísticas y características destacadas
- Enlaces a funcionalidades principales
- Diseño responsive con animaciones sutiles

#### 2. Autenticación (`/auth/signin`, `/auth/signup`)
- Formularios modernos con glassmorphism
- Validación con React Hook Form + Zod
- Manejo de errores y estados de carga
- Diseño minimalista con gradientes sutiles
- Credenciales de demo incluidas

#### 3. Dashboard (`/dashboard`)
- Lista de ingredientes disponibles
- Botones de selección en tiempo real
- Botón "🤖 Generar Receta" prominente
- Indicador visual de ingredientes seleccionados
- Estados de carga y error
- Diseño moderno con tarjetas y animaciones

#### 4. Meal Planner (`/meal-planner`)
- **Pestaña Inventario**: Gestión de ingredientes con cantidades y unidades
- **Pestaña Calendario**: Planificación de comidas por fecha y tipo
- **Pestaña Generador**: Creación de recetas desde inventario
- Interfaz de pestañas con navegación fluida
- Componentes especializados para cada funcionalidad

#### 5. Recetas (`/recipes`)
- Lista de recetas generadas por el usuario
- Tarjetas modernas con badges de ingredientes
- Formato legible de instrucciones con iconos
- Metadatos visuales (tiempo, dificultad, porciones)
- Diseño responsive y atractivo

#### 6. Administración (`/admin`)
- Panel completo para administradores
- Gestión CRUD de ingredientes
- Modales para crear/editar ingredientes
- Información de sesión y estadísticas
- Interfaz moderna con validaciones

### Componentes Reutilizables

#### Navbar
- Navegación principal moderna con animaciones
- Información del usuario autenticado
- Enlaces dinámicos según rol
- Botón de logout
- Diseño sticky con backdrop blur
- Menú móvil responsive

#### FoodCard
- Tarjeta moderna para mostrar ingredientes
- Botones de edición y eliminación
- Estados visuales (disponible/no disponible)
- Bordes sutiles y sombras suaves
- Animaciones hover con Framer Motion

#### FoodForm
- Formulario modal para crear/editar alimentos
- Validación con React Hook Form + Zod
- Estados de carga y error
- Diseño moderno con glassmorphism
- Campos para categoría y unidad

#### InventoryManager
- Gestión completa de inventario de ingredientes
- Formulario para agregar ingredientes con cantidades
- Lista de inventario con fechas de vencimiento
- Filtros por categoría y estado
- Validaciones de cantidades y unidades

#### MealCalendar
- Calendario interactivo para planificar comidas
- Selección de tipos de comida (desayuno, almuerzo, merienda, cena)
- Formulario para programar comidas
- Visualización de comidas programadas
- Navegación por meses

#### RecipeGenerator
- Generador avanzado de recetas desde inventario
- Selección de tipo de comida y porciones
- Opción para sugerir ingredientes adicionales
- Integración con IA para recetas personalizadas
- Estados de carga y resultados

#### ProtectedRoute
- Componente wrapper para rutas protegidas
- Redirección automática si no está autenticado
- Soporte para roles específicos

## 🔧 Configuración y Variables de Entorno

### Archivo `.env.local` Requerido
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cookify"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Google Gemini API
GEMINI_API_KEY="tu-api-key-de-gemini-aqui"
```

### Scripts NPM Disponibles
```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint",
  "db:seed": "tsx prisma/seed.ts",
  "db:reset": "prisma migrate reset --force && npm run db:seed"
}
```

## 📊 Datos de Prueba

### Usuarios Creados por Seed
- **Usuario Demo**: `demo@cookify.com` / `demo123` (rol: USER)
- **Admin Demo**: `admin@cookify.com` / `admin123` (rol: ADMIN)

### Ingredientes Incluidos
1. Tomate - Fruto rojo y jugoso, perfecto para ensaladas y salsas
2. Cebolla - Bulbo aromático, base de muchos platos
3. Ajo - Condimento esencial con sabor intenso
4. Pimiento - Verdura colorida y dulce, rica en vitaminas
5. Zanahoria - Raíz naranja, dulce y crujiente
6. Papa - Tubérculo versátil, base de muchos platos
7. Lechuga - Hoja verde fresca, perfecta para ensaladas
8. Pepino - Verdura refrescante y acuosa

## 🚀 Funcionalidades Implementadas

### ✅ Completadas
1. **Sistema de Autenticación Completo**
   - Registro e inicio de sesión
   - Roles de usuario (USER/ADMIN)
   - Protección de rutas con middleware
   - Sesiones JWT
   - Páginas de autenticación modernas

2. **Gestión de Ingredientes**
   - CRUD completo para alimentos
   - Categorización de ingredientes (verdura, fruta, carne, etc.)
   - Unidades de medida específicas (piezas, gramos, litros, etc.)
   - Solo admins pueden agregar/editar ingredientes
   - Usuarios pueden seleccionar ingredientes disponibles

3. **Sistema de Inventario Avanzado**
   - Gestión de cantidades específicas por ingrediente
   - Unidades de medida personalizadas
   - Fechas de vencimiento
   - Notas personalizadas
   - Filtros por categoría y estado

4. **Calendario de Comidas**
   - Planificación de comidas por fecha
   - Tipos de comida (desayuno, almuerzo, merienda, cena)
   - Programación de recetas en fechas específicas
   - Seguimiento de comidas completadas
   - Navegación por meses

5. **Generación de Recetas con IA (Doble Sistema)**
   - **Sistema Básico**: Recetas desde ingredientes seleccionados
   - **Sistema Avanzado**: Recetas desde inventario con cantidades
   - Integración con Google Gemini 1.5 Flash
   - Recetas personalizadas por tipo de comida
   - Sugerencias de ingredientes adicionales
   - Formato estructurado y legible
   - Almacenamiento en base de datos

6. **Interfaz de Usuario Moderna**
   - Diseño minimalista con Tailwind CSS v4
   - Animaciones sutiles con Framer Motion
   - Iconos modernos con Lucide React
   - Responsive design completo
   - Estados de carga y error
   - Navegación intuitiva con pestañas
   - Glassmorphism y efectos visuales

7. **APIs RESTful Completas**
   - Endpoints para inventario y calendario
   - Validación de datos con Zod
   - Manejo de errores robusto
   - Autenticación en endpoints protegidos
   - Generación de recetas desde inventario
   - CRUD completo para todas las entidades

## 🔄 Flujos de Usuario

### Flujo Básico (Dashboard)
1. **Registro/Login**: Usuario se registra o inicia sesión
2. **Selección de Ingredientes**: Va a "Dashboard" y marca ingredientes disponibles
3. **Generación de Receta**: Hace click en "🤖 Generar Receta"
4. **Visualización**: Ve la receta generada en "Mis Recetas"
5. **Gestión**: Puede generar más recetas con diferentes combinaciones

### Flujo Avanzado (Meal Planner)
1. **Registro/Login**: Usuario se registra o inicia sesión
2. **Gestión de Inventario**: Va a "Meal Planner" → "Inventario" y agrega ingredientes con cantidades específicas
3. **Planificación**: Va a "Calendario" y programa comidas por fecha y tipo
4. **Generación Inteligente**: Va a "Generador" y crea recetas basadas en inventario disponible
5. **Programación**: Asigna recetas generadas a fechas específicas en el calendario
6. **Seguimiento**: Marca comidas como completadas y gestiona su planificación semanal

## 🛡️ Seguridad Implementada

- **Autenticación JWT** con NextAuth.js
- **Hash de contraseñas** con bcryptjs
- **Protección de rutas** con middleware
- **Validación de datos** con Zod
- **Sanitización de inputs** en formularios
- **Roles y permisos** implementados

## 📈 Escalabilidad y Rendimiento

- **App Router** de Next.js 15 para mejor rendimiento
- **Turbopack** para builds más rápidos
- **Prisma ORM** para consultas optimizadas
- **Componentes optimizados** con React
- **Lazy loading** de componentes
- **Middleware eficiente** para protección de rutas

## 🧪 Testing y Calidad

- **TypeScript** para type safety
- **ESLint** configurado para calidad de código
- **Validación de esquemas** con Zod
- **Manejo de errores** robusto
- **Estados de carga** en todas las operaciones

## 🚀 Deployment

### Requisitos para Producción
1. Base de datos PostgreSQL
2. Variables de entorno configuradas
3. API Key de Google Gemini
4. NEXTAUTH_SECRET seguro

### Comandos de Build
```bash
npm run build    # Build de producción
npm run start    # Servidor de producción
```

## 🔮 Próximas Funcionalidades Sugeridas

### Funcionalidades de Recetas
1. **Favoritos de Recetas**: Marcar recetas como favoritas
2. **Calificaciones**: Sistema de rating para recetas
3. **Compartir Recetas**: Enlaces para compartir recetas
4. **Exportar Recetas**: PDF o texto plano
5. **Filtros Avanzados**: Por tiempo, dificultad, tipo de comida

### Funcionalidades de Inventario
6. **Notificaciones**: Recordatorios de ingredientes próximos a vencer
7. **Integración con Lista de Compras**: Generar listas de compras automáticamente
8. **Historial de Ingredientes**: Ver ingredientes usados anteriormente
9. **Análisis de Consumo**: Estadísticas de uso de ingredientes
10. **Sugerencias de Compra**: IA que sugiere qué comprar basado en patrones

### Funcionalidades de Calendario
11. **Planificación Semanal**: Vista semanal del calendario
12. **Plantillas de Menú**: Crear y reutilizar menús semanales
13. **Compartir Calendarios**: Compartir planificación con familia
14. **Recordatorios de Comidas**: Notificaciones antes de cocinar
15. **Análisis Nutricional**: Calcular nutrientes de comidas planificadas

### Funcionalidades Técnicas
16. **Modo Offline**: Cache de recetas para uso sin conexión
17. **Multiidioma**: Soporte para múltiples idiomas
18. **API Pública**: Permitir integración con otras aplicaciones
19. **Backup Automático**: Respaldo automático de datos
20. **Analytics**: Dashboard de uso y estadísticas

## 📞 Soporte y Mantenimiento

### Logs y Debugging
- Logs detallados en consola del servidor
- Manejo de errores con mensajes informativos
- Estados de carga visibles para el usuario

### Monitoreo
- Errores de API capturados y logueados
- Tiempos de respuesta de Gemini monitoreados
- Estados de autenticación trackeados

---

## 🎯 Conclusión

Cookify es una aplicación completa y funcional que demuestra la integración exitosa de:
- **Frontend moderno** con Next.js 15 y Tailwind CSS v4
- **Backend robusto** con API Routes y validación Zod
- **Base de datos relacional** con Prisma y PostgreSQL
- **Autenticación segura** con NextAuth.js y JWT
- **Inteligencia artificial** con Google Gemini 1.5 Flash
- **UI/UX excelente** con animaciones Framer Motion y iconos Lucide
- **Sistema de inventario** con cantidades y unidades específicas
- **Calendario de comidas** con planificación avanzada
- **Generación inteligente** de recetas basada en inventario disponible

### Características Destacadas
- **Doble sistema de generación**: Básico (ingredientes) y Avanzado (inventario)
- **Planificación completa**: Desde inventario hasta calendario de comidas
- **Interfaz moderna**: Diseño minimalista con glassmorphism y animaciones
- **Responsive design**: Funciona perfectamente en todos los dispositivos
- **Seguridad robusta**: Autenticación, roles y validación de datos
- **Escalabilidad**: Arquitectura preparada para crecimiento

La aplicación está lista para producción y puede ser extendida con funcionalidades adicionales según las necesidades del negocio.

**Estado actual**: ✅ **COMPLETAMENTE FUNCIONAL**
**Build status**: ✅ **SIN ERRORES**
**Linting**: ✅ **LIMPIO**
**TypeScript**: ✅ **SIN ERRORES**
**Nuevas funcionalidades**: ✅ **IMPLEMENTADAS Y FUNCIONANDO**
