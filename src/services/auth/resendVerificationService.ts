import { prisma } from "../../database/prisma";
import { UserStatus } from "../../types/enums";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * REENVIAR VERIFICAÇÃO DE EMAIL
 * Invalida token anterior, gera novo e reenvia o email
 */
export class ResendVerificationService {
  private emailService = new EmailService(createEmailProvider());

  async execute(data: { email: string }) {
    // Buscar usuário pendente (busca global — paciente não tem clínica)
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        status: UserStatus.PENDING_ACTIVATION,
      },
    });

    if (!user) {
      // Resposta genérica por segurança (não revela se email existe)
      return {
        message:
          "Se este email estiver cadastrado e pendente de verificação, um novo link foi enviado.",
      };
    }

    // Gerar novo token (25 minutos)
    const verification = createVerificationData(25);

    // Invalidar token anterior e salvar novo
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      },
    });

    // Reenviar email
    await this.emailService.sendPatientVerificationEmail(user.email, user.name, verification.token);

    return {
      message: "Novo link de verificação enviado. Verifique sua caixa de entrada.",
    };
  }
}
