import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { MembershipRepository } from "../../repository/membershipRepository";
import { UserRepository } from "../../repository/userRepository";
import { AppointmentStatus, UserRole, UserStatus } from "../../types/enums";
import type { ProfessionalDetails } from "../../types/professional";
import type { UpdateProfessionalInput } from "../../types/user";
import { RequestEmailChangeService } from "../auth/emailChangeService";

dayjs.extend(utc);
dayjs.extend(timezone);

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
] as const;

export const toRegistrationStatus = (status: string) => {
  if (status === UserStatus.PENDING_ACTIVATION) return "INVITE_SENT";
  if (status === UserStatus.EMAIL_VERIFIED) return "EMAIL_VERIFIED";
  if (status === UserStatus.ACTIVE) return "COMPLETED";
  if (status === UserStatus.INACTIVE) return "INACTIVE";
  if (status === UserStatus.BLOCKED) return "BLOCKED";
  return "UNKNOWN";
};

const hasAnyDefinedField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

export type { ProfessionalDetails };

export class GetProfessionalByIdService {
  async execute(clinicId: string, professionalId: string): Promise<ProfessionalDetails> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();
    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        clinicId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!professional) {
      throw new Error("Profissional nao encontrado");
    }

    const [appointmentsThisMonth, upcomingActiveAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId,
          professionalId: professional.id,
          appointmentDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          professionalId: professional.id,
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
      id: professional.id,
      userId: professional.userId,
      name: professional.user.name,
      email: professional.user.email,
      phone: professional.user.phone,
      // Desativar é por clínica (Professional.isActive), não na conta.
      status: professional.isActive ? professional.user.status : UserStatus.INACTIVE,
      registrationStatus: toRegistrationStatus(professional.user.status),
      avatarUrl: professional.user.avatarUrl,
      lastLoginAt: professional.user.lastLoginAt,
      createdAt: professional.user.createdAt,
      isActive: professional.isActive,
      professionalCouncil: professional.professionalCouncil,
      registrationNumber: professional.registrationNumber,
      registrationState: professional.registrationState,
      defaultAppointmentDuration: professional.defaultAppointmentDuration,
      specialties: professional.specialties.map((item) => ({
        id: item.specialty.id,
        name: item.specialty.name,
        isPrimary: item.isPrimary,
      })),
      appointmentsThisMonth,
      upcomingActiveAppointments,
      canDeactivate: upcomingActiveAppointments === 0,
    };
  }
}

export class UpdateProfessionalService {
  private userRepository = new UserRepository();
  private auditLogRepository = new AuditLogRepository();
  private membershipRepository = new MembershipRepository();

  /** `clinicId` = clínica ativa do ADMIN (req.clinicId); a rota já exige ADMIN. */
  async execute(
    adminId: string,
    clinicId: string,
    professionalId: string,
    data: UpdateProfessionalInput,
  ) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin) {
      throw new Error("Apenas administradores podem editar profissionais");
    }

    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        clinicId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!professional) {
      throw new Error("Profissional nao encontrado");
    }

    const normalizedData = {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      specialty: data.specialty?.trim(),
      professionalCouncil: data.professionalCouncil?.trim(),
      registrationNumber: data.registrationNumber?.trim(),
      registrationState: data.registrationState?.trim().toUpperCase(),
      defaultAppointmentDuration: data.defaultAppointmentDuration,
      isActive: data.isActive,
      formations: data.formations,
    };

    if (!hasAnyDefinedField(normalizedData)) {
      throw new Error("Informe ao menos um campo para atualizacao");
    }

    const emailChanged =
      normalizedData.email !== undefined && normalizedData.email !== professional.user.email;

    if (emailChanged && normalizedData.email) {
      const existingUser = await this.userRepository.findByEmail(normalizedData.email);
      if (existingUser && existingUser.id !== professional.user.id) {
        throw Object.assign(new Error("Este e-mail já está em uso por outra conta."), {
          statusCode: 409,
        });
      }
    }

    // O e-mail é o login da CONTA inteira. Se a pessoa também é paciente ou
    // trabalha em outra clínica, uma clínica não pode trocar o acesso dela.
    if (
      emailChanged &&
      (await this.membershipRepository.hasOtherIdentity(professional.user.id, clinicId))
    ) {
      throw Object.assign(
        new Error(
          "O e-mail desta conta é gerenciado pela própria pessoa, pois ela também usa o Minha Clínica fora desta clínica.",
        ),
        { statusCode: 403, code: "EMAIL_MANAGED_BY_OWNER" },
      );
    }

    const userUpdateData: {
      name?: string;
    } = {};

    const professionalUpdateData: {
      professionalCouncil?: string;
      registrationNumber?: string;
      registrationState?: string;
      defaultAppointmentDuration?: number;
      isActive?: boolean;
      formations?: string;
    } = {};

    if (normalizedData.name !== undefined) {
      userUpdateData.name = normalizedData.name;
    }

    if (normalizedData.professionalCouncil !== undefined) {
      professionalUpdateData.professionalCouncil = normalizedData.professionalCouncil;
    }

    if (normalizedData.registrationNumber !== undefined) {
      professionalUpdateData.registrationNumber = normalizedData.registrationNumber;
    }

    if (normalizedData.registrationState !== undefined) {
      professionalUpdateData.registrationState = normalizedData.registrationState;
    }

    if (normalizedData.defaultAppointmentDuration !== undefined) {
      professionalUpdateData.defaultAppointmentDuration = normalizedData.defaultAppointmentDuration;
    }

    if (normalizedData.isActive !== undefined) {
      professionalUpdateData.isActive = normalizedData.isActive;
    }

    if (normalizedData.formations !== undefined) {
      professionalUpdateData.formations = normalizedData.formations;
    }

    // Desativar/reativar vale só nesta clínica (Professional.isActive). A conta
    // (User.status) não muda — a pessoa pode ser paciente ou trabalhar em
    // outra clínica.
    //
    // E-mail nunca muda direto: vai para o fluxo de confirmação
    // (RequestEmailChangeService), que mantém o e-mail atual válido até o dono
    // da nova caixa confirmar.
    const requiresEmailConfirmation = emailChanged;

    const hasValidUpdate =
      hasAnyDefinedField(userUpdateData) ||
      hasAnyDefinedField(professionalUpdateData) ||
      Boolean(normalizedData.specialty) ||
      requiresEmailConfirmation;

    if (!hasValidUpdate) {
      throw new Error("Nenhuma alteracao valida foi encontrada para atualizar");
    }

    await prisma.$transaction(async (tx) => {
      if (hasAnyDefinedField(userUpdateData)) {
        await tx.user.update({
          where: { id: professional.user.id },
          data: userUpdateData,
        });
      }

      if (hasAnyDefinedField(professionalUpdateData)) {
        await tx.professional.update({
          where: { id: professional.id },
          data: professionalUpdateData,
        });
      }

      if (normalizedData.specialty) {
        const specialtyRecord = await tx.specialty.upsert({
          where: {
            clinicId_name: {
              clinicId,
              name: normalizedData.specialty,
            },
          },
          update: {},
          create: {
            clinicId,
            name: normalizedData.specialty,
          },
        });

        await tx.professionalSpecialty.updateMany({
          where: {
            professionalId: professional.id,
          },
          data: {
            isPrimary: false,
          },
        });

        await tx.professionalSpecialty.upsert({
          where: {
            professionalId_specialtyId: {
              professionalId: professional.id,
              specialtyId: specialtyRecord.id,
            },
          },
          update: {
            isPrimary: true,
          },
          create: {
            professionalId: professional.id,
            specialtyId: specialtyRecord.id,
            isPrimary: true,
          },
        });
      }
    });

    if (
      normalizedData.isActive !== undefined &&
      normalizedData.isActive !== professional.isActive
    ) {
      await this.auditLogRepository.create({
        clinicId,
        userId: adminId,
        userName: admin.name,
        action: normalizedData.isActive ? "ACTIVATE_PROFESSIONAL" : "DEACTIVATE_PROFESSIONAL",
        entity: "Professional",
        entityId: professional.id,
      });
    }

    // Usuário ativo: dispara a confirmação (audita lá dentro). O e-mail atual
    // segue valendo até o dono da nova caixa clicar no link.
    if (requiresEmailConfirmation && normalizedData.email) {
      await new RequestEmailChangeService().execute({
        targetUserId: professional.user.id,
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
      message: requiresEmailConfirmation
        ? "Profissional atualizado. A troca de e-mail só vale após o profissional confirmar pelo link enviado ao novo endereço."
        : "Profissional atualizado com sucesso",
      inviteResent: false,
      emailChangePending: requiresEmailConfirmation ? normalizedData.email : undefined,
    };
  }
}

export class DeactivateProfessionalService {
  private userRepository = new UserRepository();
  private auditLogRepository = new AuditLogRepository();
  private membershipRepository = new MembershipRepository();

  /** `clinicId` = clínica ativa do ADMIN (req.clinicId); a rota já exige ADMIN. */
  async execute(adminId: string, clinicId: string, professionalId: string) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin) {
      throw new Error("Apenas administradores podem desativar profissionais");
    }

    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        clinicId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!professional) {
      throw new Error("Profissional nao encontrado");
    }

    const upcomingActiveAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        professionalId: professional.id,
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
        "Nao e possivel remover: existem agendamentos ativos vinculados a este profissional",
      );
    }

    const userId = professional.user.id;

    // Desligar é encerrar o papel NESTA clínica. O histórico de consultas e
    // prontuários fica intacto (Appointment.professional usa onDelete:
    // Restrict de propósito). A conta só é anonimizada quando não sobra mais
    // nada dela: nenhum outro papel aqui, nenhuma outra clínica e nenhum
    // registro de paciente — antes, anonimizava sempre e destruía o login e a
    // identidade de quem também era paciente.
    const { accountAnonymized } = await prisma.$transaction(async (tx) => {
      await tx.professional.update({
        where: { id: professional.id },
        data: { isActive: false, deletedAt: new Date(), bio: null, formations: null },
      });

      const membership = await this.membershipRepository.revokeRole(
        { userId, clinicId, role: UserRole.PROFESSIONAL },
        tx,
      );
      const stillMemberHere = Boolean(membership && membership.roles.length > 0);
      const hasOtherIdentity = await this.membershipRepository.hasOtherIdentity(
        userId,
        clinicId,
        tx,
      );

      if (stillMemberHere || hasOtherIdentity) {
        return { accountAnonymized: false };
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.INACTIVE,
          name: "Profissional removido",
          email: `deleted-${userId}@removido.local`,
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
      action: "REMOVE_PROFESSIONAL",
      entity: "Professional",
      entityId: professional.id,
      oldData: { name: professional.user.name },
      newData: { accountAnonymized },
    });

    return {
      message: "Profissional removido com sucesso",
    };
  }
}
