-- AlterTable
ALTER TABLE "public"."Food" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Food" ADD CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
