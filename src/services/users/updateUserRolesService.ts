import type { Prisma } from "../../../generated/prisma";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { MembershipRepository } from "../../repository/membershipRepository";
import { Gender, NotificationChannel, NotificationType, UserRole } from "../../types/enums";
import { isStaffRole, sortRoles } from "../../utils/roles";
import { IssueSessionService } from "../auth/issueSessionService";
import { loadRequestAuth } from "../auth/sessionContext";

type Tx = Prisma.TransactionClient;

const auditLogRepository = new AuditLogRepository();
const membershipRepository = new MembershipRepository();

/**
 * Papéis que cada perfil pode ligar/desligar em si mesmo, na clínica ativa.
 *
 * - ADMIN da clínica: PROFESSIONAL, RECEPTIONIST e PATIENT (nunca tira o
 *   próprio ADMIN por aqui).
 * - Equipe sem ADMIN: só PATIENT.
 * - Conta só de paciente (sem clínica ativa): nada — entrar numa equipe é por
 *   convite aceito ou clínica cadastrada, nunca por autoatribuição.
 */
const TOGGLEABLE_BY_ADMIN: readonly UserRole[] = [
  UserRole.PROFESSIONAL,
  UserRole.RECEPTIONIST,
  UserRole.PATIENT,
];

export class UpdateUserRolesService {
  async execute(userId: string, clinicId: string | null, requestedRoles: UserRole[]) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, cpf: true },
    });
    if (!user) throw new Error("Usuário não encontrado");

    const current = await loadRequestAuth(userId, clinicId);
    const currentRoles = current?.roles ?? [];
    const wanted = sortRoles(requestedRoles);

    const isAdmin = currentRoles.includes(UserRole.ADMIN);
    const toggleable: readonly UserRole[] = !clinicId
      ? []
      : isAdmin
        ? TOGGLEABLE_BY_ADMIN
        : [UserRole.PATIENT];

    const changed = sortRoles([
      ...wanted.filter((r) => !currentRoles.includes(r)),
      ...currentRoles.filter((r) => !wanted.includes(r)),
    ]);
    const notAllowed = changed.filter((r) => !toggleable.includes(r));

    if (notAllowed.length > 0) {
      const message = !clinicId
        ? "Para trabalhar numa clínica, aceite um convite ou cadastre sua clínica."
        : `Papéis não permitidos: ${notAllowed.join(", ")}`;
      throw Object.assign(new Error(message), { statusCode: 403 });
    }

    if (wanted.length === 0) {
      throw Object.assign(new Error("A conta precisa manter ao menos um papel."), {
        statusCode: 400,
      });
    }

    const { professionalCreated } = await prisma.$transaction(async (tx) => {
      let created = false;

      if (clinicId) {
        for (const role of changed.filter(isStaffRole)) {
          if (wanted.includes(role)) {
            await membershipRepository.grantRole({ userId, clinicId, role }, tx);
          } else {
            await membershipRepository.revokeRole({ userId, clinicId, role }, tx);
          }
        }
        // Executado dentro da transação para que um erro (ex.: CPF ausente ao
        // ativar PATIENT) desfaça também a mudança no vínculo.
        created = await reconcileProfessional(tx, userId, clinicId, wanted);
      }

      if (changed.includes(UserRole.PATIENT)) {
        await reconcilePatient(tx, userId, user.cpf, wanted);
      }

      return { professionalCreated: created };
    });

    if (clinicId) {
      await auditLogRepository.create({
        clinicId,
        userId: user.id,
        userName: user.name,
        action: "UPDATE_USER_ROLES",
        entity: "User",
        entityId: user.id,
        oldData: { roles: currentRoles },
        newData: { roles: wanted },
      });
    }

    if (professionalCreated && clinicId) {
      notifyCompleteProfessionalProfile(user, clinicId);
    }

    // Sessão nova na mesma clínica, com os papéis já aplicados.
    const session = await new IssueSessionService().execute(userId, { clinicId });

    return { token: session.accessToken, roles: session.user.roles, user: session.user };
  }
}

/**
 * Garante que o registro Professional DESTA clínica existe e está ativo quando
 * PROFESSIONAL está nos papéis, ou o desativa quando não está. Não deleta, para
 * preservar histórico (agenda, consultas). Devolve true se criou o registro.
 */
export async function reconcileProfessional(
  tx: Tx,
  userId: string,
  clinicId: string,
  roles: readonly UserRole[],
): Promise<boolean> {
  const hasProfessional = roles.includes(UserRole.PROFESSIONAL);
  const existing = await tx.professional.findUnique({
    where: { userId_clinicId: { userId, clinicId } },
  });

  if (hasProfessional) {
    if (existing) {
      if (!existing.isActive || existing.deletedAt) {
        await tx.professional.update({
          where: { id: existing.id },
          data: { isActive: true, deletedAt: null },
        });
      }
      return false;
    }
    // Campos obrigatórios (conselho, registro, UF) em branco — completados no
    // perfil do profissional.
    await tx.professional.create({
      data: {
        clinicId,
        userId,
        professionalCouncil: "",
        registrationNumber: "",
        registrationState: "",
      },
    });
    return true;
  }

  if (existing?.isActive) {
    await tx.professional.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }
  return false;
}

/**
 * Garante que o registro Patient (global) existe e está ativo quando PATIENT
 * está nos papéis; desativa quando não está, sem apagar histórico de consultas.
 */
export async function reconcilePatient(
  tx: Tx,
  userId: string,
  userCpf: string | null,
  roles: readonly UserRole[],
): Promise<void> {
  const hasPatient = roles.includes(UserRole.PATIENT);
  const existing = await tx.patient.findUnique({ where: { userId } });

  if (hasPatient) {
    if (existing) {
      if (!existing.isActive) {
        await tx.patient.update({ where: { id: existing.id }, data: { isActive: true } });
      }
      return;
    }

    if (!userCpf) {
      throw Object.assign(
        new Error("Preencha o CPF no seu perfil antes de ativar o papel de Paciente."),
        { statusCode: 400 },
      );
    }

    const cpfOwner = await tx.patient.findUnique({ where: { cpf: userCpf } });
    if (cpfOwner) {
      throw Object.assign(
        new Error("Este CPF já está cadastrado como paciente por outro usuário."),
        { statusCode: 409 },
      );
    }

    await tx.patient.create({
      data: {
        userId,
        cpf: userCpf,
        dateOfBirth: new Date("1900-01-01"), // Placeholder — atualizar via perfil do paciente
        gender: Gender.PREFER_NOT_TO_SAY, // Placeholder — atualizar via perfil do paciente
      },
    });
    return;
  }

  if (existing?.isActive) {
    await tx.patient.update({ where: { id: existing.id }, data: { isActive: false } });
  }
}

/** Avisa o profissional para completar o perfil (fire-and-forget). */
function notifyCompleteProfessionalProfile(
  user: { id: string; name: string; email: string; phone: string | null },
  clinicId: string,
): void {
  void (async () => {
    try {
      const { NotificationRepository } = await import("../../repository/notificationRepository");
      await new NotificationRepository().create({
        clinicId,
        recipientEmail: user.email,
        recipientPhone: user.phone ?? undefined,
        recipientName: user.name,
        recipientUserId: user.id,
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.IN_APP,
        subject: "Complete seu perfil profissional",
        message:
          "Complete seu perfil profissional — adicione conselho, especialidades e horários de atendimento.",
      });
    } catch {
      // fire-and-forget: não propaga erro
    }
  })();
}
