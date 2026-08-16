import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { UserRepository } from "../../repository/userRepository";
import { AppointmentStatus, UserRole, UserStatus } from "../../types/enums";
import type { ReceptionDetails } from "../../types/receptionist";
import type { UpdateReceptionInput } from "../../types/user";
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

export type { ReceptionDetails };

export class GetReceptionByIdService {
  async execute(clinicId: string, receptionistId: string): Promise<ReceptionDetails> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();
    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const receptionist = await prisma.user.findFirst({
      where: {
        id: receptionistId,
        clinicId,
        role: UserRole.RECEPTIONIST,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!receptionist) {
      throw new Error("Recepcionista nao encontrado");
    }

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
      registrationStatus: toRegistrationStatus(receptionist.status),
      appointmentsThisMonth,
      upcomingActiveAppointments,
      canDeactivate: upcomingActiveAppointments === 0,
    };
  }
}

export class UpdateReceptionService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());
  private auditLogRepository = new AuditLogRepository();

  async execute(adminId: string, receptionistId: string, data: UpdateReceptionInput) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem editar recepcionistas");
    }

    if (!admin.clinicId) {
      throw new Error("Admin nao esta vinculado a uma clinica");
    }

    const clinicId = admin.clinicId;

    const receptionist = await prisma.user.findFirst({
      where: {
        id: receptionistId,
        clinicId,
        role: UserRole.RECEPTIONIST,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!receptionist) {
      throw new Error("Recepcionista nao encontrado");
    }

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
      const existingUser = await this.userRepository.findByEmail(clinicId, normalizedData.email);
      if (existingUser && existingUser.id !== receptionist.id) {
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

    if (normalizedData.name !== undefined) {
      userUpdateData.name = normalizedData.name;
    }

    if (emailChanged && normalizedData.email) {
      userUpdateData.email = normalizedData.email;
    }

    let shouldResendInvite = false;
    let verificationTokenToSend: string | null = null;

    // E-mail troca de login e controla reset de senha — exige reverificacao
    // sempre, nao so quando o usuario ainda nao esta ACTIVE (antes disso
    // deixava o ADMIN trocar o e-mail de um recepcionista ja ativo sem
    // nenhuma confirmacao do dono da nova caixa de entrada).
    if (emailChanged) {
      const verification = createVerificationData(48);
      userUpdateData.status = UserStatus.PENDING_ACTIVATION;
      userUpdateData.verificationToken = verification.hashedToken;
      userUpdateData.verificationExpires = verification.expiresAt;
      shouldResendInvite = true;
      verificationTokenToSend = verification.token;
    } else if (normalizedData.isActive !== undefined) {
      userUpdateData.status = normalizedData.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    if (!hasAnyDefinedField(userUpdateData)) {
      throw new Error("Nenhuma alteracao valida foi encontrada para atualizar");
    }

    await prisma.user.update({
      where: { id: receptionist.id },
      data: userUpdateData,
    });

    if (emailChanged && normalizedData.email) {
      await this.auditLogRepository.create({
        clinicId,
        userId: adminId,
        userName: admin.name,
        action: "CHANGE_EMAIL",
        entity: "User",
        entityId: receptionist.id,
        oldData: { email: receptionist.email },
        newData: { email: normalizedData.email },
      });
    }

    if (shouldResendInvite && verificationTokenToSend) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { tradeName: true },
      });

      if (!clinic) {
        throw new Error("Clinica nao encontrada");
      }

      await this.emailService.sendStaffInviteEmail(
        normalizedData.email ?? receptionist.email,
        normalizedData.name ?? receptionist.name,
        clinic.tradeName,
        UserRole.RECEPTIONIST,
        verificationTokenToSend,
      );
    }

    return {
      message: shouldResendInvite
        ? "Recepcionista atualizado e convite reenviado"
        : "Recepcionista atualizado com sucesso",
      inviteResent: shouldResendInvite,
    };
  }
}

export class DeactivateReceptionService {
  private userRepository = new UserRepository();

  async execute(adminId: string, receptionistId: string) {
    const admin = await this.userRepository.findById(adminId);

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem desativar recepcionistas");
    }

    if (!admin.clinicId) {
      throw new Error("Admin nao esta vinculado a uma clinica");
    }

    const clinicId = admin.clinicId;
    const startOfToday = dayjs().tz(DEFAULT_TIMEZONE).startOf("day").toDate();

    const receptionist = await prisma.user.findFirst({
      where: {
        id: receptionistId,
        clinicId,
        role: UserRole.RECEPTIONIST,
      },
      select: {
        id: true,
      },
    });

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

    // Soft delete + anonimização: preserva o histórico de agendamentos criados
    // por este usuário, mas apaga os dados pessoais da recepcionista.
    await prisma.user.update({
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

    return {
      message: "Recepcionista removido com sucesso",
    };
  }
}
