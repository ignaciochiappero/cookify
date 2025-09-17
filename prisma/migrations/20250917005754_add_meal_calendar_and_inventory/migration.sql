-- CreateEnum
CREATE TYPE "public"."FoodCategory" AS ENUM ('VEGETABLE', 'FRUIT', 'MEAT', 'DAIRY', 'GRAIN', 'LIQUID', 'SPICE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FoodUnit" AS ENUM ('PIECE', 'GRAM', 'KILOGRAM', 'LITER', 'MILLILITER', 'CUP', 'TABLESPOON', 'TEASPOON', 'POUND', 'OUNCE');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'SNACK', 'DINNER');

-- AlterTable
ALTER TABLE "public"."Food" ADD COLUMN     "category" "public"."FoodCategory" NOT NULL DEFAULT 'VEGETABLE',
ADD COLUMN     "unit" "public"."FoodUnit" NOT NULL DEFAULT 'PIECE';

-- CreateTable
CREATE TABLE "public"."UserIngredientInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "public"."FoodUnit" NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIngredientInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MealCalendar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "recipeId" TEXT,
    "customMealName" TEXT,
    "isPlanned" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIngredientInventory_userId_foodId_key" ON "public"."UserIngredientInventory"("userId", "foodId");

-- CreateIndex
CREATE UNIQUE INDEX "MealCalendar_userId_date_mealType_key" ON "public"."MealCalendar"("userId", "date", "mealType");

-- AddForeignKey
ALTER TABLE "public"."UserIngredientInventory" ADD CONSTRAINT "UserIngredientInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserIngredientInventory" ADD CONSTRAINT "UserIngredientInventory_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "public"."Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealCalendar" ADD CONSTRAINT "MealCalendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealCalendar" ADD CONSTRAINT "MealCalendar_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
