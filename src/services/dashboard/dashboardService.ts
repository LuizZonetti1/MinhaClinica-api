import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DashboardRepository } from "../../repository/dashboardRepository";
import type { DashboardSummary, MonthlyFinancials } from "../../types/dashboard";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export class DashboardService {
  private repository: DashboardRepository;

  constructor() {
    this.repository = new DashboardRepository();
  }

  async getSummary(clinicId: string): Promise<DashboardSummary> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const today = now.startOf("day").toDate();
    const firstDayOfMonth = now.startOf("month").toDate();
    const firstDayOfNextMonth = now.add(1, "month").startOf("month").toDate();

    const [
      totalPatients,
      appointmentsToday,
      appointmentsThisMonth,
      totalProfessionals,
      income,
      expense,
    ] = await Promise.all([
      this.repository.countPatients(clinicId),
      this.repository.countAppointmentsToday(clinicId, today),
      this.repository.countAppointmentsThisMonth(clinicId, firstDayOfMonth, firstDayOfNextMonth),
      this.repository.countProfessionals(clinicId),
      this.repository.getMonthlyIncome(clinicId, firstDayOfMonth),
      this.repository.getMonthlyExpense(clinicId, firstDayOfMonth),
    ]);

    return {
      totalPatients,
      appointmentsToday,
      appointmentsThisMonth,
      totalProfessionals,
      monthlyBalance: income - expense,
      referenceDate: now.format("YYYY-MM-DD"),
    };
  }

  async getMonthlyFinancials(clinicId: string): Promise<MonthlyFinancials> {
    const firstDayOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();

    const [income, expense] = await Promise.all([
      this.repository.getMonthlyIncome(clinicId, firstDayOfMonth),
      this.repository.getMonthlyExpense(clinicId, firstDayOfMonth),
    ]);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }
}
