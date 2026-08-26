import { prisma } from "../../database/prisma";
import type { UserRole } from "../../types/enums";
import { generateAuthToken } from "../../utils/jwtUtils";

export interface IssuedSession {
  /** Token de sessão, no mesmo formato emitido pelo login. */
  accessToken: string;
  /** null = sem política de inatividade (paciente/clínica sem settings). */
  sessionTimeoutMinutes: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roles: string[];
    clinicId: string | null;
    clinicName: string | null;
    termsAccepted: boolean;
  };
}

/**
 * Emite a sessão de quem acabou de concluir a Etapa 3 do cadastro.
 *
 * As quatro telas de conclusão (paciente, clínica, profissional, recepção) já
 * liam `accessToken` da resposta e mandavam o usuário para /dashboard — mas
 * nenhum endpoint do backend devolvia esse campo. Resultado: cadastro concluído
 * com sucesso e, no passo seguinte, PrivateRoutes jogava a pessoa em /login sem
 * explicação, logo depois de ela ter criado a senha.
 *
 * O formato espelha LoginService de propósito: mesmo token (generateAuthToken),
 * mesmo `user` e o mesmo sessionTimeoutMinutes, para o cliente tratar a sessão
 * recém-criada exatamente como trataria um login normal.
 */
export class IssueSessionService {
  async execute(userId: string): Promise<IssuedSession> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clinic: { include: { settings: true } } },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const roles = user.roles.length > 0 ? user.roles : [user.role];

    const accessToken = generateAuthToken(
      user.id,
      user.clinicId,
      user.role as UserRole,
      user.name,
      {},
      roles as UserRole[],
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      sessionTimeoutMinutes: user.clinicId
        ? (user.clinic?.settings?.sessionTimeoutMinutes ?? null)
        : null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles,
        clinicId: user.clinicId,
        clinicName: user.clinic?.tradeName ?? null,
        termsAccepted: Boolean(user.termsAcceptedAt && user.privacyAcceptedAt),
      },
    };
  }
}
