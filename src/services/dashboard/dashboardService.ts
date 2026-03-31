import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DashboardRepository } from "../../repository/dashboardRepository";
import { AutoNoShowService } from "../appointments/autoNoShowService";
import { AppointmentStatus, TransactionType } from "../../types/enums";
import type { DashboardHistoricalItem, DashboardSummary, MonthlyFinancials } from "../../types/dashboard";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const PT_MONTHS: Record<number, string> = {
  1: "Jan",
  2: "Fev",
  3: "Mar",
  4: "Abr",
  5: "Mai",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Set",
  10: "Out",
  11: "Nov",
  12: "Dez",
};

export class DashboardService {
  private repository: DashboardRepository;
  private autoNoShowService: AutoNoShowService;

  constructor() {
    this.repository = new DashboardRepository();
    this.autoNoShowService = new AutoNoShowService();
  }

  async getSummary(clinicId: string): Promise<DashboardSummary> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const todayStart = now.startOf("day").toDate();
    const tomorrowStart = now.add(1, "day").startOf("day").toDate();
    const firstDayOfMonth = now.startOf("month").toDate();
    const firstDayOfNextMonth = now.add(1, "month").startOf("month").toDate();

    await this.autoNoShowService.markOverdueByClinic(clinicId, now);

    const [
      totalPatients,
      appointmentsToday,
      appointmentsThisMonth,
      totalProfessionals,
      income,
      expense,
    ] = await Promise.all([
      this.repository.countPatients(clinicId),
      this.repository.countAppointmentsToday(clinicId, todayStart, tomorrowStart),
      this.repository.countAppointmentsThisMonth(clinicId, firstDayOfMonth, firstDayOfNextMonth),
      this.repository.countProfessionals(clinicId),
      this.repository.getMonthlyIncome(clinicId, firstDayOfMonth, firstDayOfNextMonth),
      this.repository.getMonthlyExpense(clinicId, firstDayOfMonth, firstDayOfNextMonth),
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
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const firstDayOfMonth = now.startOf("month").toDate();
    const firstDayOfNextMonth = now.add(1, "month").startOf("month").toDate();

    const [income, expense] = await Promise.all([
      this.repository.getMonthlyIncome(clinicId, firstDayOfMonth, firstDayOfNextMonth),
      this.repository.getMonthlyExpense(clinicId, firstDayOfMonth, firstDayOfNextMonth),
    ]);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  async getHistorical(clinicId: string, months = 6): Promise<DashboardHistoricalItem[]> {
    const normalizedMonths = Number.isFinite(months) ? Math.max(1, Math.min(24, Math.trunc(months))) : 6;
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const startDate = now
      .subtract(normalizedMonths - 1, "month")
      .startOf("month")
      .toDate();
    const endDate = now.add(1, "month").startOf("month").toDate();

    const [appointments, financialRecords] = await Promise.all([
      this.repository.listAppointmentsInPeriod(clinicId, startDate, endDate),
      this.repository.listFinancialRecordsInPeriod(clinicId, startDate, endDate),
    ]);

    const monthKeys: string[] = [];
    for (let i = normalizedMonths - 1; i >= 0; i -= 1) {
      monthKeys.push(now.subtract(i, "month").format("YYYY-MM"));
    }

    const consultationsByMonth = new Map<string, number>();
    for (const key of monthKeys) {
      consultationsByMonth.set(key, 0);
    }

    for (const appointment of appointments) {
      if (appointment.status !== AppointmentStatus.COMPLETED) continue;

      // @db.Date chega como UTC midnight; utc() evita deslocamento de dia.
      const monthKey = dayjs(appointment.appointmentDate).utc().format("YYYY-MM");
      if (!consultationsByMonth.has(monthKey)) continue;
      consultationsByMonth.set(monthKey, (consultationsByMonth.get(monthKey) ?? 0) + 1);
    }

    const revenueByMonth = new Map<string, number>();
    for (const key of monthKeys) {
      revenueByMonth.set(key, 0);
    }

    for (const record of financialRecords) {
      // @db.Date chega como UTC midnight; utc() evita deslocamento de dia.
      const monthKey = dayjs(record.referenceDate).utc().format("YYYY-MM");
      if (!revenueByMonth.has(monthKey)) continue;

      const amount = Number(record.amount);
      const signal = record.type === TransactionType.EXPENSE ? -1 : 1;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) ?? 0) + amount * signal);
    }

    return monthKeys.map((key) => {
      const monthNumber = Number(key.split("-")[1] ?? "0");
      return {
        month: PT_MONTHS[monthNumber] ?? key,
        consultations: consultationsByMonth.get(key) ?? 0,
        revenue: revenueByMonth.get(key) ?? 0,
      };
    });
  }
}
