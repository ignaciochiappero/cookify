-- AlterTable
ALTER TABLE "public"."Recipe" ADD COLUMN     "customHealthConditions" TEXT[],
ADD COLUMN     "healthConditions" TEXT[];
