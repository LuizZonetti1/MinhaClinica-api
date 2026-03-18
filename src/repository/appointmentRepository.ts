import { prisma } from "../database/prisma";
import type { CreateAppointmentInput } from "../types/appointment";
import type { AppointmentChannel, AppointmentType, DayOfWeek } from "../types/enums";

export class AppointmentRepository {
  /** Etapa 1 — Busca pacientes da clínica por nome ou CPF */
  async searchPatients(q: string, clinicId: string) {
    return prisma.patient.findMany({
      where: {
        AND: [
          {
            OR: [
              { clinicId },
              { appointments: { some: { clinicId } } },
            ],
          },
          {
            OR: [
              { user: { name: { contains: q, mode: "insensitive" } } },
              { cpf: { contains: q } },
            ],
          },
        ],
      },
      select: {
        id: true,
        cpf: true,
        user: {
          select: { id: true, name: true, phone: true },
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
          select: { id: true, name: true },
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
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
    return count > 0;
  }
}
