import { prisma } from "../database/prisma";
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
  async findAppointmentForReschedule(appointmentId: string, userId: string, clinicId: string) {
    return prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId,
        patient: { userId },
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
}
