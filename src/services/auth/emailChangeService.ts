import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import type { AuditContext } from "../../types/document";
import {
  createVerificationData,
  hashToken,
  isTokenExpired,
} from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

const auditLogRepository = new AuditLogRepository();

const CONFIRMATION_EXPIRATION_MINUTES = 24 * 60; // 24h

/**
 * Solicita a troca do e-mail de login.
 *
 * O e-mail ATUAL continua valendo até a confirmação: nada é alterado em
 * User.email aqui, só o par pendingEmail/pendingEmailToken. Isso fecha a
 * brecha de o ADMIN trocar o e-mail de alguém (e-mail controla reset de
 * senha => tomada de conta) sem quebrar o usuário: ele não é deslogado, não
 * perde a senha e não precisa refazer cadastro.
 *
 * Não reusa o fluxo de convite/reverificação: aquele coloca o usuário em
 * PENDING_ACTIVATION e manda para CompleteProfessionalService, que faz
 * professional.create() — com Professional.userId @unique, isso estoura para
 * quem já é profissional ativo.
 */
export class RequestEmailChangeService {
  private emailService = new EmailService(createEmailProvider());

  async execute(params: {
    targetUserId: string;
    newEmail: string;
    context: AuditContext;
    /** Nome de quem pediu, para o corpo do e-mail (ADMIN ou o próprio usuário). */
    requestedByName: string;
  }): Promise<void> {
    const { targetUserId, context, requestedByName } = params;
    const newEmail = params.newEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, activeClinicId: true },
    });

    if (!user) {
      throw Object.assign(new Error("Usuário não encontrado"), { statusCode: 404 });
    }

    if (newEmail === user.email.toLowerCase()) {
      throw Object.assign(new Error("O novo e-mail é igual ao atual."), { statusCode: 400 });
    }

    // E-mail é único globalmente (User @@unique([email]))
    const taken = await prisma.user.findFirst({
      where: { email: newEmail, id: { not: targetUserId } },
      select: { id: true },
    });
    if (taken) {
      throw Object.assign(new Error("Este e-mail já está em uso por outra conta."), {
        statusCode: 409,
      });
    }

    const verification = createVerificationData(CONFIRMATION_EXPIRATION_MINUTES);

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        pendingEmail: newEmail,
        pendingEmailToken: verification.hashedToken,
        pendingEmailExpires: verification.expiresAt,
      },
    });

    // Registrado na clínica em que o pedido foi feito (ADMIN trocando o e-mail
    // de alguém da equipe) ou, se veio da própria pessoa sem clínica ativa, na
    // clínica preferida dela. Conta só de paciente não entra em log de clínica.
    const auditClinicId = context.clinicId ?? user.activeClinicId;
    if (auditClinicId) {
      await auditLogRepository.create({
        clinicId: auditClinicId,
        userId: context.userId,
        userName: context.userName,
        action: "REQUEST_EMAIL_CHANGE",
        entity: "User",
        entityId: user.id,
        oldData: { email: user.email },
        newData: { pendingEmail: newEmail },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    // Enviado para o e-mail NOVO: só quem controla aquela caixa confirma.
    // Falha aqui não pode passar em silêncio — o pedido já foi persistido.
    await this.emailService.sendEmailChangeConfirmationEmail(
      newEmail,
      user.name,
      requestedByName,
      user.email,
      verification.token,
    );
  }
}

/**
 * Confirma a troca: só aqui User.email realmente muda.
 * Público (autenticado apenas pelo token que foi para a caixa nova).
 */
export class ConfirmEmailChangeService {
  async execute(rawToken: string): Promise<{ email: string }> {
    if (!rawToken) {
      throw Object.assign(new Error("Token inválido"), { statusCode: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { pendingEmailToken: hashToken(rawToken) },
      select: {
        id: true,
        name: true,
        email: true,
        activeClinicId: true,
        pendingEmail: true,
        pendingEmailExpires: true,
      },
    });

    if (!user || !user.pendingEmail || !user.pendingEmailExpires) {
      throw Object.assign(new Error("Token inválido ou já utilizado."), { statusCode: 400 });
    }

    if (isTokenExpired(user.pendingEmailExpires)) {
      throw Object.assign(new Error("Token expirado. Solicite a troca novamente."), {
        statusCode: 400,
      });
    }

    // Corrida: alguém pode ter tomado o e-mail entre o pedido e a confirmação.
    const taken = await prisma.user.findFirst({
      where: { email: user.pendingEmail, id: { not: user.id } },
      select: { id: true },
    });
    if (taken) {
      throw Object.assign(new Error("Este e-mail já está em uso por outra conta."), {
        statusCode: 409,
      });
    }

    const previousEmail = user.email;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpires: null,
      },
    });

    if (user.activeClinicId) {
      await auditLogRepository.create({
        clinicId: user.activeClinicId,
        userId: null, // confirmado pelo dono do token, sem sessão autenticada
        userName: user.name,
        action: "CONFIRM_EMAIL_CHANGE",
        entity: "User",
        entityId: user.id,
        oldData: { email: previousEmail },
        newData: { email: user.pendingEmail },
      });
    }

    return { email: user.pendingEmail };
  }
}
