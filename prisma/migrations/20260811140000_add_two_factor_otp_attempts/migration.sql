-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorOtpAttempts" INTEGER NOT NULL DEFAULT 0;
