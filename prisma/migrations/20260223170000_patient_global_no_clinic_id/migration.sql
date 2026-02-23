-- Tornar clinicId nullable em users (pacientes não têm clínica no registro)
ALTER TABLE "users" ALTER COLUMN "clinicId" DROP NOT NULL;

-- Tornar clinicId nullable em patients (vínculo ocorre ao agendar consulta)
ALTER TABLE "patients" ALTER COLUMN "clinicId" DROP NOT NULL;

-- Remover unique composta (clinicId, cpf) de users — CPF agora é globalmente único
DROP INDEX "users_clinicId_cpf_key";

-- Remover unique composta (clinicId, cpf) de patients — CPF agora é globalmente único
DROP INDEX "patients_clinicId_cpf_key";

-- Adicionar unique global de email em users
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Adicionar unique global de cpf em users
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- Adicionar unique global de cpf em patients
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");
