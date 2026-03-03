import { prisma } from "../../database/prisma";
import { type UserRole, UserStatus } from "../../types/enums";
import { generateTempRegistrationToken } from "../../utils/jwtUtils";
import { hashToken, isTokenExpired } from "../../utils/verificationTokenUtils";

/**
 * VERIFICAR EMAIL - ETAPA 2
 * Verifica token de email e retorna JWT temporário para Etapa 3
 */
export class VerifyEmailService {
  async execute(token: string) {
    // Hash do token para buscar no banco
    const hashedToken = hashToken(token);

    // Buscar usuário com este token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        status: UserStatus.PENDING_ACTIVATION,
      },
    });

    if (!user) {
      throw new Error("Token inválido ou email já verificado");
    }

    // Verificar expiração
    if (!user.verificationExpires || isTokenExpired(user.verificationExpires)) {
      throw new Error("Token expirado. Solicite um novo link de verificação.");
    }

    // Atualizar status para EMAIL_VERIFIED e invalidar o token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.EMAIL_VERIFIED,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    // Gerar JWT temporário com scope restrito (válido por 30 min)
    const tempToken = generateTempRegistrationToken(user.id, user.clinicId, user.role as UserRole);

    return {
      tempToken,
      userId: user.id,
      role: user.role as (typeof UserRole)[keyof typeof UserRole],
      name: user.name,
      email: user.email,
      message: "Email verificado com sucesso. Complete seu cadastro.",
    };
  }
}
