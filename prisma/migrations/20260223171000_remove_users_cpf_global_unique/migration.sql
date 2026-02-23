-- Remove o índice único global de CPF em users.
-- A unicidade de CPF para pacientes é garantida na tabela patients (patients_cpf_key).
-- Para staff/profissionais é verificada a nível de serviço por clínica.
DROP INDEX IF EXISTS "users_cpf_key";
