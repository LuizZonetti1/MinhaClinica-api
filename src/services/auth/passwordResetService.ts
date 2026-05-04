import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { AuthEmailService, createEmailProvider } from "../email/emailService";

/**
 * Inicia o fluxo de recuperação de senha.
 * Gera um token aleatório, salva o hash no banco e envia o email com o link.
 *
 * O token em texto claro vai na URL; apenas o hash fica no banco (segurança).
 */
export class ForgotPasswordService {
    async execute(email: string): Promise<void> {
        // Busca pelo email (único globalmente no sistema)
        const user = await prisma.user.findFirst({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, name: true, email: true, status: true },
        });

        // Resposta genérica — não revela se o email existe ou não (evita user enumeration)
        if (!user || user.status !== "ACTIVE") {
            return;
        }

        // Token aleatório de 32 bytes → 64 caracteres hex (vai na URL)
        const rawToken = crypto.randomBytes(32).toString("hex");

        // Apenas o hash vai pro banco
        const hashedToken = await bcrypt.hash(rawToken, 10);

        // Expiração: 15 minutos
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpires: expiresAt,
            },
        });

        const emailSvc = new AuthEmailService(createEmailProvider());
        emailSvc
            .sendForgotPasswordEmail(user.email, user.name, rawToken)
            .catch((err) => console.error("[forgot-password] Falha ao enviar email:", err));
    }
}

/**
 * Conclui o fluxo de recuperação de senha.
 * Valida o token e atualiza a senha do usuário.
 */
export class ResetPasswordService {
    async execute(rawToken: string, newPassword: string): Promise<void> {
        if (!rawToken || rawToken.length < 32) {
            throw Object.assign(new Error("Token inválido"), { statusCode: 400 });
        }

        // Busca todos os usuários com token de reset não expirado
        // (não dá para buscar diretamente pelo hash sem saber o valor original)
        const users = await prisma.user.findMany({
            where: {
                passwordResetToken: { not: null },
                passwordResetExpires: { gt: new Date() },
            },
            select: {
                id: true,
                passwordResetToken: true,
                passwordResetExpires: true,
            },
        });

        // Verifica qual usuário tem o hash correspondente ao token recebido
        let matchedUserId: string | null = null;
        for (const user of users) {
            if (user.passwordResetToken) {
                const matches = await bcrypt.compare(rawToken, user.passwordResetToken);
                if (matches) {
                    matchedUserId = user.id;
                    break;
                }
            }
        }

        if (!matchedUserId) {
            throw Object.assign(
                new Error("Token inválido ou expirado. Solicite um novo link."),
                { statusCode: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: matchedUserId },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
    }
}
