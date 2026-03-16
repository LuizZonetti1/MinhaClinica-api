import { prisma } from "../database/prisma";
import { TransactionType } from "../types/enums";

export interface CreateTransactionInput {
  clinicId: string;
  userId: string;
  type: string;
  title: string;
  description?: string;
  amount: number;
  category?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  referenceDate?: string;
  dueDate?: string | null;
  notes?: string | null;
}

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

  async createTransaction(input: CreateTransactionInput) {
    const today = new Date().toISOString().slice(0, 10);

    return prisma.financialRecord.create({
      data: {
        clinicId: input.clinicId,
        type: input.type as "INCOME" | "EXPENSE",
        description: input.title,
        category: input.category,
        amount: input.amount,
        paymentMethod: input.paymentMethod as any,
        paymentStatus: (input.paymentStatus as any) ?? "PENDING",
        referenceDate: new Date(input.referenceDate ?? today),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.description ?? input.notes ?? null,
        createdBy: input.userId,
      },
    });
  }
}
