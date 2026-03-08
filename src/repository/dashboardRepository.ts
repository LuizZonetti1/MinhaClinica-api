import { prisma } from "../database/prisma";
import { AppointmentStatus, TransactionType } from "../types/enums";

export class DashboardRepository {
  async countPatients(clinicId: string): Promise<number> {
    return prisma.patient.count({
      where: { clinicId },
    });
  }

  async countAppointmentsToday(clinicId: string, today: Date): Promise<number> {
    return prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: today,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    });
  }

  async countAppointmentsThisMonth(
    clinicId: string,
    firstDayOfMonth: Date,
    firstDayOfNextMonth: Date,
  ): Promise<number> {
    return prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    });
  }

  async countProfessionals(clinicId: string): Promise<number> {
    return prisma.professional.count({
      where: { clinicId },
    });
  }

  async getMonthlyIncome(clinicId: string, firstDayOfMonth: Date): Promise<number> {
    const result = await prisma.financialRecord.aggregate({
      where: {
        clinicId,
        type: TransactionType.INCOME,
        referenceDate: { gte: firstDayOfMonth },
      },
      _sum: { amount: true },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async getMonthlyExpense(clinicId: string, firstDayOfMonth: Date): Promise<number> {
    const result = await prisma.financialRecord.aggregate({
      where: {
        clinicId,
        type: TransactionType.EXPENSE,
        referenceDate: { gte: firstDayOfMonth },
      },
      _sum: { amount: true },
    });

    return Number(result._sum?.amount ?? 0);
  }
}
