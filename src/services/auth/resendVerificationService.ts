import { prisma } from "../../database/prisma";
import { UserRole, UserStatus } from "../../types/enums";
import {
  createVerificationData,
  INVITE_EXPIRATION_MINUTES,
} from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * REENVIAR VERIFICAÇÃO DE EMAIL
 * Invalida token anterior, gera novo e reenvia o email
 */
export class ResendVerificationService {
  private emailService = new EmailService(createEmailProvider());

  async execute(data: { email: string }) {
    // Buscar usuário com cadastro em aberto (busca global — paciente não tem clínica).
    // EMAIL_VERIFIED entra junto: é quem clicou no link mas não concluiu a Etapa 3,
    // e sem ele o "Reenviar convite" do admin não tinha efeito nenhum nesse estado.
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        status: { in: [UserStatus.PENDING_ACTIVATION, UserStatus.EMAIL_VERIFIED] },
      },
    });

    if (!user) {
      // Resposta genérica por segurança (não revela se email existe)
      return {
        message:
          "Se este email estiver cadastrado e pendente de verificação, um novo link foi enviado.",
      };
    }

    // A validade acompanha o template que será enviado logo abaixo: convite de
    // profissional promete 48h, verificação de paciente promete 25 minutos.
    const verification = createVerificationData(
      user.role === UserRole.PROFESSIONAL ? INVITE_EXPIRATION_MINUTES : 25,
    );

    // Invalidar token anterior e salvar novo. O status volta para
    // PENDING_ACTIVATION porque é o que VerifyEmailService exige para aceitar o
    // link — reenviar para quem já estava em EMAIL_VERIFIED geraria um link que
    // falharia. Nada se perde: a conta ainda não existe de fato nesse estágio.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.PENDING_ACTIVATION,
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
