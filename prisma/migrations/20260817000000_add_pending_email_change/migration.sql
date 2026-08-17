-- Troca de e-mail com confirmação pelo dono da nova caixa de entrada.
-- Aditivo e nullable: nenhuma linha existente é afetada.
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "pendingEmailToken" TEXT;
ALTER TABLE "users" ADD COLUMN "pendingEmailExpires" TIMESTAMP(3);
