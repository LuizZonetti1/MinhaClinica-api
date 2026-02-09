import { prisma } from "../../database/prisma";
import { hashToken, isTokenExpired } from "../../utils/verificationTokenUtils";

/**
 * VERIFICAR EMAIL - ETAPA 2
 * Verifica token de email (funciona para todos os tipos)
 */
export class VerifyEmailService {
    async execute(token: string) {
        // Hash do token para buscar no banco
        const hashedToken = hashToken(token);

        // Buscar usuário com este token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: hashedToken,
                status: "PENDING_ACTIVATION"
            }
        });

        if (!user) {
            throw new Error("Token inválido ou usuário já ativo");
        }

        // Verificar expiração
        if (!user.verificationExpires || isTokenExpired(user.verificationExpires)) {
            throw new Error("Token expirado");
        }

        // Retornar dados do usuário para o frontend completar cadastro
        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "Email verificado com sucesso. Complete seu cadastro."
        };
    }
}
