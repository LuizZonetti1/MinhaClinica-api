/*
  Warnings:

  - The values [EXAM,DECLARATION,REPORT] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('CLINICAL_REPORT', 'EXAM_REQUEST', 'CERTIFICATE', 'ATTENDANCE_DECLARATION', 'PRESCRIPTION', 'CONTROLLED_PRESCRIPTION', 'REFERRAL', 'MEDICAL_REPORT', 'CONSENT_FORM', 'TREATMENT_PLAN', 'BUDGET');
ALTER TABLE "documents" ALTER COLUMN "type" TYPE "DocumentType_new" USING ("type"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "public"."DocumentType_old";
COMMIT;
