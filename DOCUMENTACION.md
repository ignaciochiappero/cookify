# 🍳 Cookify - Aplicación de Generación de Recetas con IA

## 📋 Resumen Ejecutivo

**Cookify** es una aplicación web moderna construida con Next.js 15 que permite a los usuarios seleccionar ingredientes disponibles en su cocina y generar recetas personalizadas utilizando la API de Google Gemini. La aplicación incluye un sistema completo de autenticación, gestión de preferencias de ingredientes, y generación de recetas con inteligencia artificial.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 15.5.3 con App Router
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js v4
- **IA**: Google Gemini 1.5 Flash
- **Estilos**: Tailwind CSS
- **Validación**: Zod + React Hook Form
- **Lenguaje**: TypeScript
- **Build**: Turbopack

### Estructura del Proyecto
```
cookify/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── food/          # Gestión de alimentos
│   │   │   ├── recipes/       # Gestión de recetas
│   │   │   └── user/          # Preferencias de usuario
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── preferences/       # Página de preferencias
│   │   ├── recipes/           # Página de recetas
│   │   └── admin/             # Panel de administración
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades y configuración
│   ├── types/                 # Definiciones TypeScript
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
  foodPreferences UserFoodPreference[]
  recipes         Recipe[]
  accounts        Account[]
  sessions        Session[]
}

// Alimentos/Ingredientes disponibles
model Food {
  id          String   @id @default(uuid())
  name        String
  description String
  image       String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  userPreferences UserFoodPreference[]
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
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Enums
enum UserRole {
  USER
  ADMIN
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
- `/preferences` - Requiere autenticación
- `/recipes` - Requiere autenticación
- `/admin` - Requiere rol ADMIN

## 🤖 Integración con IA (Google Gemini)

### Configuración
- **Modelo**: `gemini-1.5-flash`
- **API**: Google Generative AI SDK
- **Prompt**: Optimizado para generar recetas en español
- **Formato**: JSON estructurado

### Flujo de Generación
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

### Prompt de Gemini
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

### Preferencias de Usuario
- `GET /api/user/preferences` - Obtener preferencias del usuario
- `POST /api/user/preferences` - Crear/actualizar preferencia

### Recetas
- `GET /api/recipes` - Obtener recetas del usuario
- `POST /api/recipes/generate` - Generar nueva receta con IA

## 🎨 Interfaz de Usuario

### Páginas Principales

#### 1. Página de Inicio (`/`)
- Dashboard principal
- Información sobre la aplicación
- Enlaces a funcionalidades principales

#### 2. Autenticación (`/auth/signin`, `/auth/signup`)
- Formularios de login y registro
- Validación con React Hook Form + Zod
- Manejo de errores y estados de carga

#### 3. Preferencias (`/preferences`)
- Lista de ingredientes disponibles
- Botones de selección para marcar ingredientes disponibles
- Botón "🤖 Generar Receta" prominente
- Indicador visual de ingredientes seleccionados
- Estados de carga y error

#### 4. Recetas (`/recipes`)
- Lista de recetas generadas por el usuario
- Tarjetas detalladas con toda la información
- Formato legible de instrucciones
- Metadatos (tiempo, dificultad, porciones)

#### 5. Administración (`/admin`)
- Panel básico para administradores
- Información de sesión
- Acceso a gestión de ingredientes

### Componentes Reutilizables

#### Navbar
- Navegación principal
- Información del usuario autenticado
- Enlaces dinámicos según rol
- Botón de logout

#### FoodCard
- Tarjeta para mostrar ingredientes
- Botones de edición y eliminación
- Estados visuales (disponible/no disponible)

#### FoodForm
- Formulario modal para crear/editar alimentos
- Validación con React Hook Form + Zod
- Estados de carga y error

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

2. **Gestión de Ingredientes**
   - CRUD completo para alimentos
   - Solo admins pueden agregar/editar ingredientes
   - Usuarios pueden seleccionar ingredientes disponibles

3. **Sistema de Preferencias**
   - Usuarios marcan ingredientes disponibles
   - Persistencia en base de datos
   - Interfaz intuitiva con botones de selección

4. **Generación de Recetas con IA**
   - Integración con Google Gemini
   - Recetas personalizadas basadas en ingredientes
   - Formato estructurado y legible
   - Almacenamiento en base de datos

5. **Interfaz de Usuario**
   - Diseño moderno con Tailwind CSS
   - Responsive design
   - Estados de carga y error
   - Navegación intuitiva

6. **APIs RESTful**
   - Endpoints bien estructurados
   - Validación de datos
   - Manejo de errores
   - Autenticación en endpoints protegidos

## 🔄 Flujo de Usuario Típico

1. **Registro/Login**: Usuario se registra o inicia sesión
2. **Selección de Ingredientes**: Va a "Mis Preferencias" y marca ingredientes disponibles
3. **Generación de Receta**: Hace click en "🤖 Generar Receta"
4. **Visualización**: Ve la receta generada en "Mis Recetas"
5. **Gestión**: Puede generar más recetas con diferentes combinaciones

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

1. **Favoritos de Recetas**: Marcar recetas como favoritas
2. **Calificaciones**: Sistema de rating para recetas
3. **Compartir Recetas**: Enlaces para compartir recetas
4. **Historial de Ingredientes**: Ver ingredientes usados anteriormente
5. **Filtros Avanzados**: Por tiempo, dificultad, tipo de comida
6. **Exportar Recetas**: PDF o texto plano
7. **Notificaciones**: Recordatorios de ingredientes próximos a vencer
8. **Integración con Lista de Compras**: Generar listas de compras
9. **Modo Offline**: Cache de recetas para uso sin conexión
10. **Multiidioma**: Soporte para múltiples idiomas

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
- **Frontend moderno** con Next.js 15
- **Backend robusto** con API Routes
- **Base de datos relacional** con Prisma
- **Autenticación segura** con NextAuth.js
- **Inteligencia artificial** con Google Gemini
- **UI/UX excelente** con Tailwind CSS

La aplicación está lista para producción y puede ser extendida con funcionalidades adicionales según las necesidades del negocio.

**Estado actual**: ✅ **COMPLETAMENTE FUNCIONAL**
**Build status**: ✅ **SIN ERRORES**
**Linting**: ✅ **LIMPIO**
**TypeScript**: ✅ **SIN ERRORES**
