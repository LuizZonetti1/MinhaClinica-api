import { prisma } from "../database/prisma";
import type { AppointmentStatus, DayOfWeek } from "../types/enums";
import { CONSULTATION_EXCLUDED_STATUSES } from "../utils/appointmentStatusRules";

export class ReceptionDashboardRepository {
  async countTodayByStatuses(
    clinicId: string,
    statuses: AppointmentStatus[],
    startOfDay: Date,
    endOfDay: Date,
  ) {
    return prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { in: statuses },
      },
    });
  }

  async countByDateExcludingStatuses(
    clinicId: string,
    excludedStatuses: AppointmentStatus[],
    startOfDay: Date,
    endOfDay: Date,
  ) {
    return prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: excludedStatuses },
      },
    });
  }

  async listAppointmentsByDate(clinicId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        startTime: true,
        status: true,
        type: true,
        patient: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        professional: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    });
  }

  async findAppointmentById(clinicId: string, appointmentId: string) {
    return prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      select: { id: true, status: true },
    });
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status as import("../../generated/prisma").AppointmentStatus },
      select: { id: true, status: true },
    });
  }

  async listByStatusesUntilDate(clinicId: string, statuses: AppointmentStatus[], endDate: Date) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        status: { in: statuses },
        appointmentDate: { lte: endDate },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
      },
    });
  }

  async updateStatusByIds(ids: string[], status: AppointmentStatus) {
    if (ids.length === 0) return 0;

    const result = await prisma.appointment.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return result.count;
  }

  async listProfessionalsWithAgendaData(
    clinicId: string,
    dayOfWeek: DayOfWeek,
    startOfDay: Date,
    endOfDay: Date,
  ) {
    return prisma.professional.findMany({
      where: { clinicId, isActive: true },
      select: {
        id: true,
        defaultAppointmentDuration: true,
        bufferTime: true,
        user: {
          select: { name: true, avatarUrl: true },
        },
        specialties: {
          where: { isPrimary: true },
          select: {
            specialty: { select: { name: true } },
          },
          take: 1,
        },
        workingHours: {
          where: { dayOfWeek, isWorking: true },
          select: {
            startTime: true,
            endTime: true,
            lunchBreakStart: true,
            lunchBreakEnd: true,
          },
          take: 1,
        },
        appointments: {
          where: {
            clinicId,
            appointmentDate: { gte: startOfDay, lte: endOfDay },
            status: { notIn: [...CONSULTATION_EXCLUDED_STATUSES] },
          },
          select: {
            id: true,
            startTime: true,
            status: true,
            patient: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { user: { name: "asc" } },
    });
  }
}
