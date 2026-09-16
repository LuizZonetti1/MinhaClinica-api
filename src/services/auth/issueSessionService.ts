import { prisma } from "../../database/prisma";
import { UserStatus } from "../../types/enums";
import {
  buildSessionContext,
  generateSessionToken,
  loadSessionUserById,
  type SessionUserPayload,
  toSessionUserPayload,
} from "./sessionContext";

export interface IssuedSession {
  /** Token de sessão, no mesmo formato emitido pelo login. */
  accessToken: string;
  /** null = sem política de inatividade (paciente/clínica sem settings). */
  sessionTimeoutMinutes: number | null;
  user: SessionUserPayload;
}

/**
 * Emite uma sessão no mesmo formato do login.
 *
 * Usado ao concluir um cadastro, aceitar convite, confirmar clínica e trocar a
 * clínica ativa — sempre que a conta muda de contexto sem digitar a senha de
 * novo. `clinicId` escolhe a clínica que a sessão abre (precisa ser uma clínica
 * com vínculo ativo; senão cai na preferida da conta).
 */
export class IssueSessionService {
  async execute(userId: string, options: { clinicId?: string | null } = {}): Promise<IssuedSession> {
    const user = await loadSessionUserById(userId);

    if (!user) {
      throw Object.assign(new Error("Usuário não encontrado"), { statusCode: 404 });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw Object.assign(new Error("Conta inativa. Faça login novamente."), { statusCode: 401 });
    }

    const ctx = buildSessionContext(user, options.clinicId);

    if (ctx.roles.length === 0) {
      throw Object.assign(new Error("Esta conta não tem nenhum acesso ativo."), {
        statusCode: 403,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        // Guarda a clínica aberta para o próximo login começar nela.
        ...(ctx.clinicId && ctx.clinicId !== user.activeClinicId
          ? { activeClinicId: ctx.clinicId }
          : {}),
      },
    });

    return {
      accessToken: generateSessionToken(user, ctx),
      sessionTimeoutMinutes: ctx.sessionTimeoutMinutes,
      user: toSessionUserPayload(user, ctx),
    };
  }
}
