import { prisma } from "../database/prisma";
import type { AppointmentChannel, AppointmentType, DayOfWeek } from "../types/enums";

export class AppointmentRepository {
  /** Etapa 1 — Busca pacientes globais por nome ou CPF (inclui pendentes de ativação) */
  async searchPatients(q: string, _clinicId: string) {
    return prisma.patient.findMany({
      where: {
        user: {
          status: { in: ["ACTIVE", "PENDING_ACTIVATION"] },
        },
        OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { cpf: { contains: q } }],
      },
      select: {
        id: true,
        cpf: true,
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true, status: true },
        },
      },
      orderBy: { user: { name: "asc" } },
      take: 20,
    });
  }

  /** Etapa 2 — Lista profissionais ativos da clínica */
  async listProfessionals(clinicId: string) {
    return prisma.professional.findMany({
      where: { clinicId, isActive: true },
      select: {
        id: true,
        defaultAppointmentDuration: true,
        bufferTime: true,
        calendarColor: true,
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        specialties: {
          where: { isPrimary: true },
          select: {
            specialty: { select: { name: true } },
          },
          take: 1,
        },
      },
      orderBy: { user: { name: "asc" } },
    });
  }

  /** Etapa 2 — Dados do profissional com horários e agendamentos do dia */
  async getProfessionalScheduleData(
    professionalId: string,
    clinicId: string,
    dayOfWeek: DayOfWeek,
    startOfDay: Date,
    endOfDay: Date,
  ) {
    const [professional, workingHours, scheduleBlocks, appointments] = await Promise.all([
      prisma.professional.findFirst({
        where: { id: professionalId, clinicId },
        select: {
          id: true,
          defaultAppointmentDuration: true,
          bufferTime: true,
        },
      }),
      prisma.professionalWorkingHours.findFirst({
        where: { professionalId, dayOfWeek, isWorking: true },
        select: {
          startTime: true,
          endTime: true,
          lunchBreakStart: true,
          lunchBreakEnd: true,
        },
      }),
      prisma.professionalScheduleBlock.findMany({
        where: {
          professionalId,
          startDateTime: { lte: endOfDay },
          endDateTime: { gte: startOfDay },
        },
        select: {
          startDateTime: true,
          endDateTime: true,
          isAllDay: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          professionalId,
          clinicId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    return { professional, workingHours, scheduleBlocks, appointments };
  }

  /** Etapa 3 — Cria o agendamento */
  async create(data: {
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
  }) {
    return prisma.appointment.create({ data });
  }

  /** Calendário — Lista agendamentos de um profissional num intervalo de datas */
  async listByDateRange(clinicId: string, professionalId: string, startDate: Date, endDate: Date) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        professionalId,
        appointmentDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        patientId: true,
        patient: {
          select: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
        professional: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    });
  }

  /** Calendário — Lista pacientes distintos com pelo menos uma consulta COMPLETED */
  async listCompletedPatients(clinicId: string, professionalId: string) {
    const rows = await prisma.appointment.findMany({
      where: { clinicId, professionalId, status: "COMPLETED" },
      select: {
        appointmentDate: true,
        patientId: true,
        patient: {
          select: { user: { select: { name: true, avatarUrl: true } } },
        },
      },
      orderBy: { appointmentDate: "desc" },
    });

    // Mantém somente o registro mais recente por paciente
    const seen = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!seen.has(row.patientId)) seen.set(row.patientId, row);
    }

    return Array.from(seen.values());
  }

  /** Verifica conflito de horário antes de criar */
  async hasConflict(
    professionalId: string,
    clinicId: string,
    startOfDay: Date,
    endOfDay: Date,
    startTime: string,
    endTime: string,
  ) {
    const count = await prisma.appointment.count({
      where: {
        professionalId,
        clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    return count > 0;
  }
}
