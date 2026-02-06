/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,cpf]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpf` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "cpf" VARCHAR(11) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinicId_cpf_key" ON "patients"("clinicId", "cpf");
