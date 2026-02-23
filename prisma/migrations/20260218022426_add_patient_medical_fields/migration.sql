-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "bloodType" VARCHAR(10),
ADD COLUMN     "conditions" TEXT,
ADD COLUMN     "emergencyContactName" VARCHAR(100),
ADD COLUMN     "emergencyContactPhone" VARCHAR(15),
ADD COLUMN     "medications" TEXT;
