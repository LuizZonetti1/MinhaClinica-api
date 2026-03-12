import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { UserRepository } from "../../repository/userRepository";
import { AppointmentStatus, UserRole, UserStatus } from "../../types/enums";
import type { UpdateProfessionalInput } from "../../types/user";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
] as const;

const toRegistrationStatus = (status: string) => {
  if (status === UserStatus.PENDING_ACTIVATION) return "INVITE_SENT";
  if (status === UserStatus.EMAIL_VERIFIED) return "EMAIL_VERIFIED";
  if (status === UserStatus.ACTIVE) return "COMPLETED";
  if (status === UserStatus.INACTIVE) return "INACTIVE";
  if (status === UserStatus.BLOCKED) return "BLOCKED";
  return "UNKNOWN";
};

const hasAnyDefinedField = (data: Record<string, unknown>) =>
  Object.values(data).some((value) => value !== undefined);

export interface ProfessionalDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  registrationStatus: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  defaultAppointmentDuration: number;
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
  appointmentsThisMonth: number;
  upcomingActiveAppointments: number;
  canDeactivate: boolean;
}

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
      status: professional.user.status,
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
  private emailService = new EmailService(createEmailProvider());

  async execute(adminId: string, professionalId: string, data: UpdateProfessionalInput) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem editar profissionais");
    }

    if (!admin.clinicId) {
      throw new Error("Admin nao esta vinculado a uma clinica");
    }

    const clinicId = admin.clinicId;

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
    };

    if (!hasAnyDefinedField(normalizedData)) {
      throw new Error("Informe ao menos um campo para atualizacao");
    }

    const emailChanged =
      normalizedData.email !== undefined && normalizedData.email !== professional.user.email;

    if (emailChanged && normalizedData.email) {
      const existingUser = await this.userRepository.findByEmail(clinicId, normalizedData.email);
      if (existingUser && existingUser.id !== professional.user.id) {
        throw new Error("Email ja cadastrado nesta clinica");
      }
    }

    const userUpdateData: {
      name?: string;
      email?: string;
      status?: (typeof UserStatus)[keyof typeof UserStatus];
      verificationToken?: string | null;
      verificationExpires?: Date | null;
    } = {};

    const professionalUpdateData: {
      professionalCouncil?: string;
      registrationNumber?: string;
      registrationState?: string;
      defaultAppointmentDuration?: number;
      isActive?: boolean;
    } = {};

    if (normalizedData.name !== undefined) {
      userUpdateData.name = normalizedData.name;
    }

    if (emailChanged && normalizedData.email) {
      userUpdateData.email = normalizedData.email;
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

    let shouldResendInvite = false;
    let verificationTokenToSend: string | null = null;

    if (emailChanged && professional.user.status !== UserStatus.ACTIVE) {
      const verification = createVerificationData(48);
      userUpdateData.status = UserStatus.PENDING_ACTIVATION;
      userUpdateData.verificationToken = verification.hashedToken;
      userUpdateData.verificationExpires = verification.expiresAt;
      shouldResendInvite = true;
      verificationTokenToSend = verification.token;
    } else if (normalizedData.isActive !== undefined) {
      userUpdateData.status = normalizedData.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    const hasValidUpdate =
      hasAnyDefinedField(userUpdateData) ||
      hasAnyDefinedField(professionalUpdateData) ||
      Boolean(normalizedData.specialty);

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

    if (shouldResendInvite && verificationTokenToSend) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { tradeName: true },
      });

      if (!clinic) {
        throw new Error("Clinica nao encontrada");
      }

      await this.emailService.sendProfessionalInviteEmail(
        normalizedData.email ?? professional.user.email,
        normalizedData.name ?? professional.user.name,
        clinic.tradeName,
        verificationTokenToSend,
      );
    }

    return {
      message: shouldResendInvite
        ? "Profissional atualizado e convite reenviado"
        : "Profissional atualizado com sucesso",
      inviteResent: shouldResendInvite,
    };
  }
}

export class DeactivateProfessionalService {
  private userRepository = new UserRepository();

  async execute(adminId: string, professionalId: string) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem desativar profissionais");
    }

    if (!admin.clinicId) {
      throw new Error("Admin nao esta vinculado a uma clinica");
    }

    const clinicId = admin.clinicId;
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

    // Deletar o usuário — o registro de Professional é removido em cascade
    await prisma.user.delete({
      where: { id: professional.user.id },
    });

    return {
      message: "Profissional removido com sucesso",
    };
  }
}
