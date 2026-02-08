-- DropIndex
DROP INDEX "clinics_subdomain_idx";

-- AlterTable
ALTER TABLE "clinics" ALTER COLUMN "subdomain" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "clinics_city_state_idx" ON "clinics"("city", "state");
