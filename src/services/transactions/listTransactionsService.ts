import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { TransactionRepository } from "../../repository/transactionRepository";
import { TransactionType } from "../../types/enums";
import type { TransactionListResponse, TransactionPeriod } from "../../types/transaction";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const PERIOD_MONTHS: Record<TransactionPeriod, number | null> = {
  "1m": null,
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

export class ListTransactionsService {
  private repository = new TransactionRepository();

  async execute(
    clinicId: string,
    period: TransactionPeriod,
    currentUser: { userId: string; userName: string },
  ): Promise<TransactionListResponse> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);

    const startDate =
      period === "1m"
        ? now.startOf("month").toDate()
        : now
            .subtract(PERIOD_MONTHS[period] as number, "month")
            .startOf("day")
            .toDate();

    const startDateStr =
      period === "1m"
        ? now.startOf("month").format("YYYY-MM-DD")
        : now.subtract(PERIOD_MONTHS[period] as number, "month").format("YYYY-MM-DD");

    const records = await this.repository.list(clinicId, startDate);

    // Busca nomes dos usuários em lote (exceto o próprio usuário do token)
    const otherIds = [
      ...new Set(records.map((r) => r.createdBy).filter((id) => id !== currentUser.userId)),
    ];
    const users = await prisma.user.findMany({
      where: { id: { in: otherIds } },
      select: { id: true, name: true },
    });
    const userNameMap = new Map(users.map((u) => [u.id, u.name]));
    userNameMap.set(currentUser.userId, currentUser.userName);

    const transactions = records.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.description,
      description: r.notes,
      category: r.category,
      amount: Number(r.amount),
      paymentMethod: r.paymentMethod,
      paymentStatus: r.paymentStatus,
      referenceDate: r.referenceDate,
      dueDate: r.dueDate,
      createdAt: r.createdAt,
      createdByName: userNameMap.get(r.createdBy) ?? "Desconhecido",
      createdById: r.createdBy,
    }));

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      period,
      startDate: startDateStr,
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
      },
    };
  }
}
