import { prisma } from "../../database/prisma";
import { UserRole, UserStatus } from "../../types/enums";
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

    // O template (e a URL de verificação: ...&type=patient|professional) muda
    // por papel. Reenviar o de paciente pra um profissional o levaria pro
    // fluxo de cadastro errado depois de clicar no link.
    if (user.role === UserRole.PROFESSIONAL && user.clinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: user.clinicId },
        select: { tradeName: true },
      });

      this.emailService
        .sendProfessionalInviteEmail(user.email, user.name, clinic?.tradeName ?? "", verification.token)
        .catch((err) => console.error("[reenvio] Falha ao enviar convite de profissional:", err));
    } else {
      // Reenvio fire-and-forget
      this.emailService
        .sendPatientVerificationEmail(user.email, user.name, verification.token)
        .catch((err) => console.error("[reenvio] Falha ao enviar email de verificação:", err));
    }

    return {
      message: "Novo link de verificação enviado. Verifique sua caixa de entrada.",
    };
  }
}
