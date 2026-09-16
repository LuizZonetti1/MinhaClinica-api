import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { MembershipRepository, memberOf } from "../../repository/membershipRepository";
import { UserRepository } from "../../repository/userRepository";
import { AppointmentStatus, MembershipStatus, UserRole, UserStatus } from "../../types/enums";
import type { ReceptionDetails } from "../../types/receptionist";
import type { UpdateReceptionInput } from "../../types/user";
import { RequestEmailChangeService } from "../auth/emailChangeService";

dayjs.extend(utc);
dayjs.extend(timezone);

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
] as const;

const toRegistrationStatus = (status: string) => {
  if (status === UserStatus.ACTIVE) return "COMPLETED";
  if (status === UserStatus.INACTIVE) return "INACTIVE";
  if (status === UserStatus.BLOCKED) return "BLOCKED";
  return "UNKNOWN";
};

const hasAnyDefinedField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

/**
 * Recepcionista desta clínica: conta com vínculo (não encerrado) que inclui
 * RECEPTIONIST. Traz o status do vínculo, que é o que "ativo/inativo" significa
 * aqui — a conta pode estar ativa como paciente ou em outra clínica.
 */
const findReceptionist = (clinicId: string, receptionistId: string) =>
  prisma.user.findFirst({
    where: { id: receptionistId, ...memberOf(clinicId, [UserRole.RECEPTIONIST]) },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      memberships: { where: { clinicId }, select: { id: true, status: true } },
    },
  });

export type { ReceptionDetails };

export class GetReceptionByIdService {
  async execute(clinicId: string, receptionistId: string): Promise<ReceptionDetails> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();
    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const found = await findReceptionist(clinicId, receptionistId);

    if (!found) {
      throw new Error("Recepcionista nao encontrado");
    }

    const { memberships, ...receptionist } = found;
    const status =
      memberships[0]?.status === MembershipStatus.INACTIVE
        ? UserStatus.INACTIVE
        : receptionist.status;

    const [appointmentsThisMonth, upcomingActiveAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId,
          createdBy: receptionist.id,
          appointmentDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          createdBy: receptionist.id,
          appointmentDate: {
            gte: startOfToday,
          },
          status: {
            in: [...ACTIVE_APPOINTMENT_STATUSES],
          },
        },
      }),
    ]);

    return {
      ...receptionist,
      status,
      role: UserRole.RECEPTIONIST,
      registrationStatus: toRegistrationStatus(status),
      appointmentsThisMonth,
      upcomingActiveAppointments,
      canDeactivate: upcomingActiveAppointments === 0,
    };
  }
}

export class UpdateReceptionService {
  private userRepository = new UserRepository();
  private auditLogRepository = new AuditLogRepository();
  private membershipRepository = new MembershipRepository();

  /** `clinicId` = clínica ativa do ADMIN (req.clinicId); a rota já exige ADMIN. */
  async execute(
    adminId: string,
    clinicId: string,
    receptionistId: string,
    data: UpdateReceptionInput,
  ) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin) {
      throw new Error("Apenas administradores podem editar recepcionistas");
    }

    const receptionist = await findReceptionist(clinicId, receptionistId);

    if (!receptionist) {
      throw new Error("Recepcionista nao encontrado");
    }

    const membership = receptionist.memberships[0];

    const normalizedData = {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      isActive: data.isActive,
    };

    if (!hasAnyDefinedField(normalizedData)) {
      throw new Error("Informe ao menos um campo para atualizacao");
    }

    const emailChanged =
      normalizedData.email !== undefined && normalizedData.email !== receptionist.email;

    if (emailChanged && normalizedData.email) {
      const existingUser = await this.userRepository.findByEmail(normalizedData.email);
      if (existingUser && existingUser.id !== receptionist.id) {
        throw Object.assign(new Error("Este e-mail já está em uso por outra conta."), {
          statusCode: 409,
        });
      }

      // O e-mail é o login da CONTA inteira: se a pessoa também é paciente ou
      // trabalha em outra clínica, esta clínica não pode trocar o acesso dela.
      if (await this.membershipRepository.hasOtherIdentity(receptionist.id, clinicId)) {
        throw Object.assign(
          new Error(
            "O e-mail desta conta é gerenciado pela própria pessoa, pois ela também usa o Minha Clínica fora desta clínica.",
          ),
          { statusCode: 403, code: "EMAIL_MANAGED_BY_OWNER" },
        );
      }
    }

    const nameChanged =
      normalizedData.name !== undefined && normalizedData.name !== receptionist.name;

    // Ativo/inativo é o vínculo com ESTA clínica — nunca User.status, que
    // trancaria a conta inteira (área de paciente e outras clínicas).
    const nextMembershipStatus =
      normalizedData.isActive === undefined
        ? undefined
        : normalizedData.isActive
          ? MembershipStatus.ACTIVE
          : MembershipStatus.INACTIVE;
    const statusChanged =
      nextMembershipStatus !== undefined && nextMembershipStatus !== membership?.status;

    if (!nameChanged && !statusChanged && !emailChanged) {
      throw new Error("Nenhuma alteracao valida foi encontrada para atualizar");
    }

    if (nameChanged && normalizedData.name) {
      await prisma.user.update({
        where: { id: receptionist.id },
        data: { name: normalizedData.name },
      });
    }

    if (statusChanged && membership && nextMembershipStatus) {
      await prisma.clinicMembership.update({
        where: { id: membership.id },
        data: { status: nextMembershipStatus },
      });

      await this.auditLogRepository.create({
        clinicId,
        userId: adminId,
        userName: admin.name,
        action:
          nextMembershipStatus === MembershipStatus.ACTIVE
            ? "ACTIVATE_RECEPTIONIST"
            : "DEACTIVATE_RECEPTIONIST",
        entity: "User",
        entityId: receptionist.id,
      });
    }

    // E-mail nunca muda direto: o atual continua válido até o dono da nova
    // caixa confirmar (audita lá dentro) — o e-mail controla o reset de senha.
    if (emailChanged && normalizedData.email) {
      await new RequestEmailChangeService().execute({
        targetUserId: receptionist.id,
        newEmail: normalizedData.email,
        requestedByName: admin.name,
        context: {
          userId: adminId,
          userName: admin.name,
          clinicId,
          ipAddress: null,
          userAgent: null,
        },
      });
    }

    return {
      message: emailChanged
        ? "Recepcionista atualizado. A troca de e-mail só vale após a confirmação pelo link enviado ao novo endereço."
        : "Recepcionista atualizado com sucesso",
      inviteResent: false,
      emailChangePending: emailChanged ? normalizedData.email : undefined,
    };
  }
}

export class DeactivateReceptionService {
  private userRepository = new UserRepository();
  private auditLogRepository = new AuditLogRepository();
  private membershipRepository = new MembershipRepository();

  /** `clinicId` = clínica ativa do ADMIN (req.clinicId); a rota já exige ADMIN. */
  async execute(adminId: string, clinicId: string, receptionistId: string) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin) {
      throw new Error("Apenas administradores podem desativar recepcionistas");
    }

    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const receptionist = await findReceptionist(clinicId, receptionistId);

    if (!receptionist) {
      throw new Error("Recepcionista nao encontrado");
    }

    const upcomingActiveAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        createdBy: receptionist.id,
        appointmentDate: {
          gte: startOfToday,
        },
        status: {
          in: [...ACTIVE_APPOINTMENT_STATUSES],
        },
      },
    });

    if (upcomingActiveAppointments > 0) {
      throw new Error(
        "Nao e possivel remover: existem agendamentos ativos criados por este recepcionista",
      );
    }

    // Desligar é encerrar o papel NESTA clínica, preservando o histórico de
    // agendamentos criados por esta conta. A conta só é anonimizada quando não
    // sobra mais nada dela (nenhum outro papel aqui, nenhuma outra clínica,
    // nenhum registro de paciente) — antes, anonimizava sempre e destruía o
    // login de quem também era paciente.
    const { accountAnonymized } = await prisma.$transaction(async (tx) => {
      const membership = await this.membershipRepository.revokeRole(
        { userId: receptionist.id, clinicId, role: UserRole.RECEPTIONIST },
        tx,
      );
      const stillMemberHere = Boolean(membership && membership.roles.length > 0);
      const hasOtherIdentity = await this.membershipRepository.hasOtherIdentity(
        receptionist.id,
        clinicId,
        tx,
      );

      if (stillMemberHere || hasOtherIdentity) {
        return { accountAnonymized: false };
      }

      await tx.user.update({
        where: { id: receptionist.id },
        data: {
          status: UserStatus.INACTIVE,
          name: "Recepcionista removido",
          email: `deleted-${receptionist.id}@removido.local`,
          phone: null,
          avatarUrl: null,
          deletedAt: new Date(),
        },
      });
      return { accountAnonymized: true };
    });

    await this.auditLogRepository.create({
      clinicId,
      userId: adminId,
      userName: admin.name,
      action: "REMOVE_RECEPTIONIST",
      entity: "User",
      entityId: receptionist.id,
      oldData: { name: receptionist.name },
      newData: { accountAnonymized },
    });

    return {
      message: "Recepcionista removido com sucesso",
    };
  }
}
