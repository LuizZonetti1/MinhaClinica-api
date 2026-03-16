import { prisma } from "../database/prisma";
import { PaymentStatus } from "../types/enums";
import type { CreateTransactionInput, UpdateTransactionInput } from "../types/transaction";

export class TransactionRepository {
  async create(input: CreateTransactionInput) {
    const today = new Date().toISOString().slice(0, 10);

    return prisma.financialRecord.create({
      data: {
        clinicId: input.clinicId,
        type: input.type,
        description: input.title,
        category: input.category ?? null,
        amount: input.amount,
        paymentMethod: input.paymentMethod ?? null,
        paymentStatus: input.paymentStatus ?? PaymentStatus.PENDING,
        referenceDate: new Date(input.referenceDate ?? today),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.description ?? input.notes ?? null,
        createdBy: input.userId,
      },
    });
  }

  async list(clinicId: string, startDate: Date) {
    return prisma.financialRecord.findMany({
      where: {
        clinicId,
        referenceDate: { gte: startDate },
      },
      orderBy: { referenceDate: "desc" },
      select: {
        id: true,
        type: true,
        description: true,
        notes: true,
        category: true,
        amount: true,
        paymentMethod: true,
        paymentStatus: true,
        referenceDate: true,
        dueDate: true,
        createdAt: true,
        createdBy: true,
      },
    });
  }

  async findByIdAndClinic(id: string, clinicId: string) {
    return prisma.financialRecord.findFirst({
      where: { id, clinicId },
    });
  }

  async update(id: string, input: UpdateTransactionInput) {
    return prisma.financialRecord.update({
      where: { id },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.title !== undefined && { description: input.title }),
        ...(input.description !== undefined && { notes: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        ...(input.referenceDate !== undefined && { referenceDate: new Date(input.referenceDate) }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
  }
}
