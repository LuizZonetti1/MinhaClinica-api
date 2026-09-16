import { AuditLogRepository } from "../../repository/auditLogRepository";
import { IssueSessionService } from "./issueSessionService";
import { buildSessionContext, loadSessionUserById, toSessionUserPayload } from "./sessionContext";

const auditLogRepository = new AuditLogRepository();

/**
 * GET /api/auth/session — dados atuais da sessão, sem trocar o token.
 *
 * O cliente guarda o `user` do login no storage; quando a conta ganha ou perde
 * papéis (convite aceito em outro aparelho, desligamento de uma clínica), é
 * por aqui que ele se atualiza. Mantém a clínica ativa do token.
 */
export class GetSessionService {
  async execute(userId: string, clinicId: string | null) {
    const user = await loadSessionUserById(userId);
    if (!user) {
      throw Object.assign(new Error("Usuário não encontrado"), { statusCode: 404 });
    }

    // Mantém exatamente a clínica do token (null = sessão de paciente).
    const ctx = buildSessionContext(user, clinicId);

    return {
      user: toSessionUserPayload(user, ctx),
      sessionTimeoutMinutes: ctx.sessionTimeoutMinutes,
    };
  }
}

/**
 * POST /api/auth/session/clinic — troca a clínica ativa da sessão.
 * `clinicId: null` volta para a área só de paciente.
 */
export class SwitchClinicService {
  async execute(
    userId: string,
    clinicId: string | null,
    context: { ipAddress?: string | null; userAgent?: string | null } = {},
  ) {
    const user = await loadSessionUserById(userId);
    if (!user) {
      throw Object.assign(new Error("Usuário não encontrado"), { statusCode: 404 });
    }

    if (clinicId) {
      const ctx = buildSessionContext(user, clinicId);
      if (ctx.clinicId !== clinicId) {
        throw Object.assign(new Error("Você não tem acesso a esta clínica."), {
          statusCode: 403,
          code: "CLINIC_ACCESS_DENIED",
        });
      }
    }

    const session = clinicId
      ? await new IssueSessionService().execute(userId, { clinicId })
      : await this.patientOnlySession(userId);

    if (clinicId && buildSessionContext(user, clinicId).accessLogEnabled) {
      try {
        await auditLogRepository.create({
          clinicId,
          userId,
          userName: user.name,
          action: "SWITCH_CLINIC",
          entity: "User",
          entityId: userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      } catch (err) {
        console.error("[SwitchClinicService] Falha ao registrar acesso em AuditLog:", err);
      }
    }

    return session;
  }

  /** Sessão sem clínica ativa — só faz sentido para quem é paciente. */
  private async patientOnlySession(userId: string) {
    const session = await new IssueSessionService().execute(userId, { clinicId: null });
    if (!session.user.roles.includes("PATIENT")) {
      throw Object.assign(new Error("Esta conta não tem acesso à área de paciente."), {
        statusCode: 403,
      });
    }
    return session;
  }
}
