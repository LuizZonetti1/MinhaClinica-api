-- CreateTable
CREATE TABLE "patient_comments" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "patient_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_comments_clinicId_patientId_idx" ON "patient_comments"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "patient_comments_professionalId_idx" ON "patient_comments"("professionalId");

-- AddForeignKey
ALTER TABLE "patient_comments" ADD CONSTRAINT "patient_comments_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_comments" ADD CONSTRAINT "patient_comments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_comments" ADD CONSTRAINT "patient_comments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
