import { prisma } from "../database/prisma";
import type { AppointmentStatus } from "../types/enums";

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
}
