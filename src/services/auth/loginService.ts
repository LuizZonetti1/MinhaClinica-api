import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { UserStatus } from "../../types/enums";
import { generateTwoFactorPendingToken } from "../../utils/jwtUtils";
import {
  buildSessionContext,
  generateSessionToken,
  loadSessionUserByEmail,
  toSessionUserPayload,
} from "./sessionContext";
import { SendOtpService } from "./twoFactorService";

const auditLogRepository = new AuditLogRepository();

/**
 * LOGIN - Autenticar usuário
 * E-mail e senha. A conta abre na clínica preferida (User.activeClinicId) ou
 * na primeira em que tem vínculo ativo; quem é só paciente abre sem clínica.
 */
export class LoginService {
  async execute(data: {
    email: string;
    password: string;
    deviceToken?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const user = await loadSessionUserByEmail(data.email);
    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar se conta está ativa
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("Email ou senha incorretos");
    }

    // Papéis efetivos: vínculo ativo na clínica (PROFESSIONAL exige o registro
    // Professional ativo lá) + PATIENT se o registro de paciente estiver ativo e
    // não bloqueado. Login só falha se NENHUM papel estiver usável.
    const ctx = buildSessionContext(user);
    if (ctx.roles.length === 0) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new Error("Email ou senha incorretos");
    }

    // 2FA individual (User.twoFactorEnabled) ou por política de qualquer
    // clínica em que a conta trabalha. Mesmo critério usado por
    // Send/Resend/ValidateOtp (isTwoFactorRequired) — os dois lados PRECISAM
    // concordar, senão a clínica que liga a política tranca os próprios
    // usuários para fora.
    if (ctx.twoFactorRequired) {
      let deviceTrusted = false;

      if (data.deviceToken) {
        const trusted = await prisma.trustedDevice.findFirst({
          where: {
            userId: user.id,
            deviceToken: data.deviceToken,
            expiresAt: { gt: new Date() },
          },
        });
        deviceTrusted = !!trusted;
      }

      if (!deviceTrusted) {
        // Envia OTP por email e retorna token temporário
        const otpService = new SendOtpService();
        await otpService.execute(user.id);

        const tempToken = generateTwoFactorPendingToken(
          user.id,
          ctx.clinicId,
          ctx.role,
          user.name,
          ctx.roles,
        );
        return { requires2FA: true, tempToken };
      }
    }

    // ClinicSettings.sessionTimeoutMinutes é "Encerrar sessão após
    // INATIVIDADE" — quem aplica é o frontend (contador de inatividade), não
    // o tempo de vida do token. Usar como expiresIn do JWT derrubaria o
    // usuário no meio do trabalho mesmo digitando, e não existe refresh
    // token no projeto para renovar. O token mantém as 8h de sempre e o
    // valor vai na resposta para o cliente aplicar o timeout de verdade.
    const sessionTimeoutMinutes = ctx.sessionTimeoutMinutes;

    // Gerar token JWT (clínica ativa + papéis efetivos)
    const token = generateSessionToken(user, ctx);

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // ClinicSettings.accessLogEnabled ("Log de acessos — Registrar todos os
    // acessos ao sistema", default true) tinha tela real sem nenhum efeito —
    // nenhum login era registrado em nenhum lugar. Só se aplica à clínica
    // ativa; login de quem é só paciente não entra no log de clínica nenhuma.
    // Falha ao gravar auditoria não pode derrubar o login (o handler do
    // controller transforma qualquer Error em 401) — registra e segue.
    if (ctx.clinicId && ctx.accessLogEnabled) {
      try {
        await auditLogRepository.create({
          clinicId: ctx.clinicId,
          userId: user.id,
          userName: user.name,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      } catch (err) {
        console.error("[LoginService] Falha ao registrar acesso em AuditLog:", err);
      }
    }

    return {
      requires2FA: false,
      token,
      /** null = sem política de inatividade (paciente/clínica sem settings). */
      sessionTimeoutMinutes,
      user: toSessionUserPayload(user, ctx),
    };
  }
}
