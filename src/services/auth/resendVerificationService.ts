import { prisma } from "../../database/prisma";
import { UserRole, UserStatus } from "../../types/enums";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * REENVIAR VERIFICAÇÃO DE EMAIL — cadastro de PACIENTE
 * Invalida token anterior, gera novo e reenvia o email.
 *
 * Convites de equipe não passam mais por aqui (são ClinicInvite, com reenvio
 * próprio em /api/invites/:id/resend), e o dono de clínica em cadastro usa
 * /api/clinics/register/resend-verification. Restringir a PATIENT evita mandar
 * o e-mail de paciente para quem está em outro fluxo.
 */
export class ResendVerificationService {
  private emailService = new EmailService(createEmailProvider());

  async execute(data: { email: string }) {
    // EMAIL_VERIFIED entra junto: é quem clicou no link mas não concluiu a Etapa 3.
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        role: UserRole.PATIENT,
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

    const verification = createVerificationData(25);

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

    // Reenvio fire-and-forget
    this.emailService
      .sendPatientVerificationEmail(user.email, user.name, verification.token)
      .catch((err) => console.error("[reenvio] Falha ao enviar email de verificação:", err));

    return {
      message: "Novo link de verificação enviado. Verifique sua caixa de entrada.",
    };
  }
}
