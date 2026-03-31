import { prisma } from "../database/prisma";
import { AppointmentStatus } from "../types/enums";
import { CONSULTATION_EXCLUDED_STATUSES } from "../utils/appointmentStatusRules";

export class ProfessionalDashboardRepository {
  async findProfessionalByUserId(userId: string, clinicId: string) {
    return prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });
  }

  // Same consultation rule used by admin/reception dashboards.
  async countTodayAppointments(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.count({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [...CONSULTATION_EXCLUDED_STATUSES] },
      },
    });
  }

  async countConfirmedToday(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.count({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: AppointmentStatus.CONFIRMED,
      },
    });
  }

  async countCompletedPatientsThisMonth(
    professionalId: string,
    startOfMonth: Date,
    endOfMonth: Date,
  ) {
    const result = await prisma.appointment.findMany({
      where: {
        professionalId,
        appointmentDate: { gte: startOfMonth, lte: endOfMonth },
        status: AppointmentStatus.COMPLETED,
      },
      select: { patientId: true },
      distinct: ["patientId"],
    });

    return result.length;
  }

  // Agenda keeps all statuses so the professional can see full daily history.
  async listAppointmentsByDate(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.findMany({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        notes: true,
        patient: {
          select: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }
}
