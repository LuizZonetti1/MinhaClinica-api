import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
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

  async execute(clinicId: string, period: TransactionPeriod): Promise<TransactionListResponse> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);

    const startDate =
      period === "1m"
        ? now.startOf("month").toDate()
        : now.subtract(PERIOD_MONTHS[period] as number, "month").startOf("day").toDate();

    const startDateStr =
      period === "1m"
        ? now.startOf("month").format("YYYY-MM-DD")
        : now.subtract(PERIOD_MONTHS[period] as number, "month").format("YYYY-MM-DD");

    const records = await this.repository.list(clinicId, startDate);

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
