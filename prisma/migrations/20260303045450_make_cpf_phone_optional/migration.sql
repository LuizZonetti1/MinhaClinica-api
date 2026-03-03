-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "cpf" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;
