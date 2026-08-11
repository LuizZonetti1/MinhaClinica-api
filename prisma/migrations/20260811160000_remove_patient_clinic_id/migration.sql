-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT "patients_clinicId_fkey";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "clinicId";
