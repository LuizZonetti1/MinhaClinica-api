-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "verificationExpires" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;
