import { prisma } from "../database/prisma";
import { AppointmentStatus, TransactionType, UserStatus } from "../types/enums";
import { CONSULTATION_EXCLUDED_STATUSES } from "../utils/appointmentStatusRules";

export class DashboardRepository {
  async countPatients(clinicId: string): Promise<number> {
    return prisma.patient.count({
      where: {
        appointments: {
          some: { clinicId },
        },
      },
    });
  }

  async countCompletedPatientsThisMonth(
    clinicId: string,
    firstDayOfMonth: Date,
    firstDayOfNextMonth: Date,
  ): Promise<number> {
    const rows = await prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
        status: AppointmentStatus.COMPLETED,
      },
      distinct: ["patientId"],
      select: {
        patientId: true,
      },
    });

    return rows.length;
  }

  async countAppointmentsToday(clinicId: string, startOfDay: Date, endOfDay: Date): Promise<number> {
    return prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          notIn: [...CONSULTATION_EXCLUDED_STATUSES],
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
        status: AppointmentStatus.COMPLETED,
      },
    });
  }

  /**
   * "Profissionais Ativos" do dashboard: exige as três condições juntas —
   * registro de Professional vivo, `isActive` ligado e usuário ACTIVE. Contar só
   * por `user.status` (ou só por Professional não deletado, como fazia o KPI)
   * inflava o número com convites, desligados e removidos.
   */
  async countActiveProfessionals(clinicId: string): Promise<number> {
    return prisma.professional.count({
      where: {
        clinicId,
        deletedAt: null,
        isActive: true,
        user: { status: UserStatus.ACTIVE },
      },
    });
  }

  async getMonthlyIncome(
    clinicId: string,
    firstDayOfMonth: Date,
    firstDayOfNextMonth: Date,
  ): Promise<number> {
    const result = await prisma.financialRecord.aggregate({
      where: {
        clinicId,
        type: TransactionType.INCOME,
        referenceDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async getMonthlyExpense(
    clinicId: string,
    firstDayOfMonth: Date,
    firstDayOfNextMonth: Date,
  ): Promise<number> {
    const result = await prisma.financialRecord.aggregate({
      where: {
        clinicId,
        type: TransactionType.EXPENSE,
        referenceDate: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async listAppointmentsInPeriod(clinicId: string, startDate: Date, endDate: Date) {
    return prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        appointmentDate: true,
        status: true,
      },
    });
  }

  async listFinancialRecordsInPeriod(clinicId: string, startDate: Date, endDate: Date) {
    return prisma.financialRecord.findMany({
      where: {
        clinicId,
        referenceDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        referenceDate: true,
        type: true,
        amount: true,
      },
    });
  }
}
