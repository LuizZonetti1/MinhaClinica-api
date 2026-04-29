-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_BOOKING';
ALTER TYPE "NotificationType" ADD VALUE 'CHECKIN_DONE';
ALTER TYPE "NotificationType" ADD VALUE 'PATIENT_WAITING';
ALTER TYPE "NotificationType" ADD VALUE 'REGISTRATION_COMPLETE';
ALTER TYPE "NotificationType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'DIRECT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_BLOCKED';
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_READY';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_COMPLETED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "recipientUserId" TEXT,
ADD COLUMN     "senderId" TEXT;

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_idx" ON "notifications"("recipientUserId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
