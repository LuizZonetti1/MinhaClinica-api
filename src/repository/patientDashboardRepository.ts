import { Prisma } from "../../generated/prisma";
import { prisma } from "../database/prisma";
import type { AppointmentChannel, AppointmentType } from "../types/enums";
import { AppointmentStatus } from "../types/enums";

export class PatientDashboardRepository {
  /** Resolve userId → Patient */
  async findPatientByUserId(userId: string) {
    return prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });
  }

  /** Contagem de consultas concluídas (COMPLETED) */
  async countCompleted(patientId: string): Promise<number> {
    return prisma.appointment.count({
      where: {
        patientId,
        status: AppointmentStatus.COMPLETED,
      },
    });
  }

  /** Data da última consulta concluída */
  async findLastCompletedDate(patientId: string) {
    return prisma.appointment.findFirst({
      where: {
        patientId,
        status: AppointmentStatus.COMPLETED,
      },
      select: { appointmentDate: true },
      orderBy: { appointmentDate: "desc" },
    });
  }

  /** Todas as consultas futuras agendadas ou confirmadas */
  async findUpcomingAppointments(patientId: string, today: Date) {
    return prisma.appointment.findMany({
      where: {
        patientId,
        appointmentDate: { gte: today },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        channel: true,
        professional: {
          select: {
            user: { select: { name: true, avatarUrl: true } },
            specialties: {
              where: { isPrimary: true },
              select: { specialty: { select: { name: true } } },
              take: 1,
            },
          },
        },
        clinic: {
          select: { tradeName: true },
        },
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    });
  }

  /** Lista histórico completo de consultas (futuras e passadas) */
  async listAppointments(patientId: string, status?: string) {
    return prisma.appointment.findMany({
      where: {
        patientId,
        ...(status
          ? { status: status as (typeof AppointmentStatus)[keyof typeof AppointmentStatus] }
          : {}),
      },
      select: {
        id: true,
        clinicId: true,
        professionalId: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        channel: true,
        notes: true,
        professional: {
          select: {
            user: { select: { name: true, avatarUrl: true } },
            specialties: {
              where: { isPrimary: true },
              select: { specialty: { select: { name: true } } },
              take: 1,
            },
          },
        },
        clinic: {
          select: { tradeName: true },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    });
  }

  /** Atualiza status em lote para um conjunto de agendamentos */
  async updateStatusByIds(
    appointmentIds: string[],
    status: (typeof AppointmentStatus)[keyof typeof AppointmentStatus],
  ): Promise<void> {
    if (appointmentIds.length === 0) return;

    await prisma.appointment.updateMany({
      where: { id: { in: appointmentIds } },
      data: { status },
    });
  }

  /** Busca agendamento por id verificando posse do paciente e clinicId */
  /**
   * Busca o agendamento para remarcação.
   * Modo paciente (ownerUserId informado): exige posse do paciente, além do
   * tenant. Modo clínica (ownerUserId omitido): qualquer agendamento do
   * tenant — usado pela recepção, que já tem checkRole(ADMIN, RECEPTIONIST).
   */
  async findAppointmentForReschedule(
    appointmentId: string,
    clinicId: string,
    ownerUserId?: string,
  ) {
    return prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId,
        ...(ownerUserId ? { patient: { userId: ownerUserId } } : {}),
      },
      select: {
        id: true,
        status: true,
        type: true,
        notes: true,
        patientId: true,
        channel: true,
        procedureId: true,
      },
    });
  }

  /** Verifica conflito de horário para remarcação (excluindo o próprio agendamento) */
  async hasConflictExcluding(
    excludeAppointmentId: string,
    professionalId: string,
    clinicId: string,
    startOfDay: Date,
    endOfDay: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const count = await prisma.appointment.count({
      where: {
        id: { not: excludeAppointmentId },
        professionalId,
        clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: {
          notIn: [
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
            AppointmentStatus.RESCHEDULED,
          ],
        },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    return count > 0;
  }

  /**
   * Marca o original como RESCHEDULED e cria o novo, com a checagem de
   * conflito DENTRO da mesma transação Serializable — mesma proteção que
   * AppointmentRepository.createIfNoConflict dá à criação. Sem isso, duas
   * remarcações concorrentes para o mesmo slot passariam ambas (o check e o
   * create eram dois awaits soltos).
   *
   * Em conflito de escrita real o Postgres aborta uma das transações (P2034);
   * o chamador trata como o mesmo 409 de horário ocupado.
   */
  async rescheduleIfNoConflict(data: {
    appointmentId: string;
    clinicId: string;
    patientId: string;
    professionalId: string;
    procedureId?: string;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    duration: number;
    type: AppointmentType;
    channel: AppointmentChannel;
    notes?: string;
    createdBy: string;
    startOfDay: Date;
    endOfDay: Date;
  }) {
    return prisma.$transaction(
      async (tx) => {
        const conflictCount = await tx.appointment.count({
          where: {
            id: { not: data.appointmentId },
            professionalId: data.professionalId,
            clinicId: data.clinicId,
            appointmentDate: { gte: data.startOfDay, lte: data.endOfDay },
            status: {
              notIn: [
                AppointmentStatus.CANCELLED,
                AppointmentStatus.NO_SHOW,
                AppointmentStatus.RESCHEDULED,
              ],
            },
            AND: [{ startTime: { lt: data.endTime } }, { endTime: { gt: data.startTime } }],
          },
        });

        if (conflictCount > 0) {
          throw Object.assign(
            new Error("Este horário já está ocupado. Por favor, escolha outro."),
            {
              statusCode: 409,
            },
          );
        }

        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: AppointmentStatus.RESCHEDULED },
        });

        return tx.appointment.create({
          data: {
            clinicId: data.clinicId,
            patientId: data.patientId,
            professionalId: data.professionalId,
            procedureId: data.procedureId,
            appointmentDate: data.appointmentDate,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration,
            type: data.type,
            channel: data.channel,
            notes: data.notes,
            createdBy: data.createdBy,
            rescheduledFrom: data.appointmentId,
          },
          select: { id: true, appointmentDate: true, startTime: true, endTime: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
