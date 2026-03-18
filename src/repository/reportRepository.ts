import { prisma } from "../database/prisma";
import type { TransactionType } from "../types/enums";

export class ReportRepository {
  async getAppointmentsInPeriod(clinicId: string, startDate: Date) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
      },
      select: {
        appointmentDate: true,
        status: true,
        professionalId: true,
        professional: {
          select: {
            user: { select: { name: true } },
            specialties: {
              where: { isPrimary: true },
              select: {
                specialty: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  async getFinancialRecordsInPeriod(clinicId: string, startDate: Date) {
    return prisma.financialRecord.findMany({
      where: {
        clinicId,
        referenceDate: { gte: startDate },
      },
      select: {
        referenceDate: true,
        type: true,
        amount: true,
      },
    });
  }
}
