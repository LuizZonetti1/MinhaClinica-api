-- AlterTable
ALTER TABLE "clinic_settings" ADD COLUMN     "accessLogEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "closeTime" VARCHAR(5) NOT NULL DEFAULT '18:00',
ADD COLUMN     "openTime" VARCHAR(5) NOT NULL DEFAULT '08:00',
ADD COLUMN     "sendCancellationAlert" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sendDailyReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sendNewPatientAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workingDaysPreset" VARCHAR(20) NOT NULL DEFAULT 'WEEKDAYS';
