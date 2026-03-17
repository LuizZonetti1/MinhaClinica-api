import { prisma } from "../../database/prisma";
import { UserStatus } from "../../types/enums";
import { hashToken, isTokenExpired } from "../../utils/verificationTokenUtils";

/**
 * ATIVAÇÃO DE CONTA — paciente cadastrado pela recepção
 *
 * Diferente do fluxo normal (verifyEmailService), aqui o cadastro já está completo.
 * O status vai direto de PENDING_ACTIVATION → ACTIVE.
 */
export class ActivateReceptionPatientService {
  async execute(token: string) {
    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashedToken,
        status: UserStatus.PENDING_ACTIVATION,
      },
      include: {
        patient: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw Object.assign(new Error("Token inválido ou conta já ativada"), { statusCode: 400 });
    }

    if (!user.verificationExpires || isTokenExpired(user.verificationExpires)) {
      throw Object.assign(
        new Error("Link de ativação expirado. Entre em contato com a clínica para reenvio."),
        { statusCode: 400 },
      );
    }

    // Só aceita este endpoint para pacientes cadastrados pela recepção
    // (identificado pela presença do registro Patient já criado)
    if (!user.patient) {
      throw Object.assign(
        new Error("Use o fluxo de verificação padrão para completar seu cadastro."),
        { statusCode: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return {
      message: "Conta ativada com sucesso! Faça login para acessar o portal.",
      email: user.email,
    };
  }
}
