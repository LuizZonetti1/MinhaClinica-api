-- Conta unificada: uma conta por e-mail pode ser paciente (global) e equipe em
-- várias clínicas. O vínculo com clínica sai de users.clinicId (uma clínica só,
-- com ON DELETE CASCADE que apagava a conta junto com a clínica) e vai para
-- clinic_memberships. Convites deixam de ser linhas de users e vão para
-- clinic_invites. A ordem importa: cria as estruturas novas, copia os dados
-- e só depois remove as colunas antigas.

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN "blockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "activeClinicId" TEXT;

-- CreateTable
CREATE TABLE "clinic_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "roles" "UserRole"[],
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "termsAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clinic_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_invites" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "specialtyId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT,
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_invites_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- BACKFILL
-- ============================================================

-- 1. Bloqueio por faltas passa a valer só para o papel de paciente. Roda antes
--    dos vínculos para que um membro da equipe bloqueado como paciente não
--    vire vínculo INACTIVE.
UPDATE "patients" p
SET "blockedAt" = CURRENT_TIMESTAMP
FROM "users" u
WHERE u."id" = p."userId" AND u."status" = 'BLOCKED';

UPDATE "users" u
SET "status" = 'ACTIVE'
WHERE u."status" = 'BLOCKED'
  AND EXISTS (SELECT 1 FROM "patients" p WHERE p."userId" = u."id");

-- 2. Convites ainda não concluídos (User de equipe pendente, sem Professional
--    nem Patient). O dono de uma clínica ainda em cadastro NÃO é convite: ele
--    vira vínculo PENDING mais abaixo.
CREATE TEMP TABLE "_convites_migrados" AS
SELECT u."id"
FROM "users" u
JOIN "clinics" c ON c."id" = u."clinicId"
WHERE u."role" IN ('ADMIN', 'RECEPTIONIST', 'PROFESSIONAL')
  AND u."status" IN ('PENDING_ACTIVATION', 'EMAIL_VERIFIED')
  AND NOT (u."role" = 'ADMIN' AND c."isActive" = false)
  AND NOT EXISTS (SELECT 1 FROM "professionals" p WHERE p."userId" = u."id")
  AND NOT EXISTS (SELECT 1 FROM "patients" p WHERE p."userId" = u."id");

-- O hash do token é copiado, então os links já enviados continuam valendo.
-- Quem já tinha clicado no link (EMAIL_VERIFIED) não tem mais token: o convite
-- entra vencido e o ADMIN reenvia.
INSERT INTO "clinic_invites" (
    "id", "clinicId", "email", "name", "role", "specialtyId",
    "tokenHash", "expiresAt", "status", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    u."clinicId",
    lower(u."email"),
    u."name",
    u."role",
    u."pendingSpecialtyId",
    COALESCE(u."verificationToken", 'migrado-sem-token-' || u."id"),
    COALESCE(u."verificationExpires", CURRENT_TIMESTAMP),
    'PENDING',
    u."createdAt",
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u."id" IN (SELECT "id" FROM "_convites_migrados");

-- 3. Vínculos a partir de users.clinicId. Só papéis de equipe entram no vínculo
--    (PATIENT continua global, em patients).
INSERT INTO "clinic_memberships" (
    "id", "userId", "clinicId", "roles", "status",
    "termsAcceptedAt", "createdAt", "updatedAt", "deletedAt"
)
SELECT
    gen_random_uuid()::text,
    u."id",
    u."clinicId",
    ARRAY(
        SELECT DISTINCT r
        FROM unnest(COALESCE(u."roles", '{}'::"UserRole"[]) || u."role") AS r
        WHERE r IN ('ADMIN', 'RECEPTIONIST', 'PROFESSIONAL')
        ORDER BY r
    ),
    CASE
        WHEN u."status" = 'ACTIVE' AND u."deletedAt" IS NULL THEN 'ACTIVE'
        WHEN u."role" = 'ADMIN'
            AND u."status" IN ('PENDING_ACTIVATION', 'EMAIL_VERIFIED')
            AND c."isActive" = false THEN 'PENDING'
        ELSE 'INACTIVE'
    END::"MembershipStatus",
    u."termsAcceptedAt",
    u."createdAt",
    CURRENT_TIMESTAMP,
    u."deletedAt"
FROM "users" u
JOIN "clinics" c ON c."id" = u."clinicId"
WHERE (COALESCE(u."roles", '{}'::"UserRole"[]) || u."role")
        && ARRAY['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL']::"UserRole"[]
  AND u."id" NOT IN (SELECT "id" FROM "_convites_migrados");

-- 4. Clínica preferida no login = a clínica que a conta tinha.
UPDATE "users" u
SET "activeClinicId" = m."clinicId"
FROM "clinic_memberships" m
WHERE m."userId" = u."id";

-- 5. Remove as linhas de users que eram só convite.
DELETE FROM "users" WHERE "id" IN (SELECT "id" FROM "_convites_migrados");

DROP TABLE "_convites_migrados";

-- ============================================================
-- REMOÇÃO DAS COLUNAS ANTIGAS
-- ============================================================

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_clinicId_fkey";

-- DropIndex
DROP INDEX "professionals_userId_key";

-- DropIndex
DROP INDEX "users_clinicId_email_key";

-- DropIndex
DROP INDEX "users_clinicId_role_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "clinicId",
DROP COLUMN "pendingSpecialtyId",
DROP COLUMN "roles";

-- CreateIndex
CREATE INDEX "clinic_memberships_clinicId_status_idx" ON "clinic_memberships"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_memberships_userId_clinicId_key" ON "clinic_memberships"("userId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_invites_tokenHash_key" ON "clinic_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "clinic_invites_clinicId_status_idx" ON "clinic_invites"("clinicId", "status");

-- CreateIndex
CREATE INDEX "clinic_invites_email_idx" ON "clinic_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_userId_clinicId_key" ON "professionals"("userId", "clinicId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_activeClinicId_fkey" FOREIGN KEY ("activeClinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_memberships" ADD CONSTRAINT "clinic_memberships_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_invites" ADD CONSTRAINT "clinic_invites_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
