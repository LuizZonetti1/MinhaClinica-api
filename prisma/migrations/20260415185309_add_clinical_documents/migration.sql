-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CLINICAL_REPORT', 'EXAM', 'CERTIFICATE', 'DECLARATION', 'PRESCRIPTION', 'CONTROLLED_PRESCRIPTION', 'REFERRAL', 'REPORT', 'CONSENT_FORM', 'TREATMENT_PLAN', 'BUDGET');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SENT', 'ADDENDUM');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED_WITH_ADDENDUM';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT;

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "originalDocumentId" TEXT,
    "integrityHash" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_counters" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_documentNumber_key" ON "documents"("documentNumber");

-- CreateIndex
CREATE INDEX "documents_appointmentId_idx" ON "documents"("appointmentId");

-- CreateIndex
CREATE INDEX "documents_clinicId_createdAt_idx" ON "documents"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "documents_originalDocumentId_idx" ON "documents"("originalDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_counters_clinicId_year_key" ON "document_counters"("clinicId", "year");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_originalDocumentId_fkey" FOREIGN KEY ("originalDocumentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_counters" ADD CONSTRAINT "document_counters_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
