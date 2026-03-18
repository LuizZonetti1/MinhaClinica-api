-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'RETURN', 'EXAM', 'EMERGENCY');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
ALTER COLUMN "procedureId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "professionals" ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 15,
ALTER COLUMN "defaultAppointmentDuration" SET DEFAULT 60;
