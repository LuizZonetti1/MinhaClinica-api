import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserStatus } from "../../types/enums";
import { hashToken, isTokenExpired } from "../../utils/verificationTokenUtils";

/**
 * ATIVAÇÃO DE CONTA — paciente cadastrado pela recepção
 *
 * Diferente do fluxo normal (verifyEmailService), aqui o cadastro já está completo.
 * O status vai direto de PENDING_ACTIVATION → ACTIVE, e é neste passo que o
 * paciente define a própria senha de acesso (nunca trafegou por e-mail).
 */
export class ActivateReceptionPatientService {
  /**
   * Localiza o usuário do token sem consumi-lo — usado tanto para validar o
   * link ao carregar a página quanto como primeiro passo da ativação real.
   */
  private async findPendingUser(token: string) {
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

    return user;
  }

  /**
   * Valida o token sem consumi-lo. Usado pela página /ativar-conta ao
   * carregar, antes de exibir o formulário de senha.
   */
  async validateToken(token: string): Promise<{ email: string }> {
    const user = await this.findPendingUser(token);
    return { email: user.email };
  }

  /**
   * Ativa a conta de fato: grava a senha escolhida pelo paciente, marca
   * ACTIVE e invalida o token (uso único).
   */
  async execute(token: string, password: string) {
    const user = await this.findPendingUser(token);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        password: hashedPassword,
        verificationToken: null,
        verificationExpires: null,
        mustChangePassword: false,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    return {
      message: "Conta ativada com sucesso! Faça login para acessar o portal.",
      email: user.email,
    };
  }
}
