import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReportRepository } from "../../repository/reportRepository";
import { AppointmentStatus, TransactionType } from "../../types/enums";
import type { ReportData, ReportPeriod } from "../../types/report";

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

const PERIOD_MONTHS: Record<ReportPeriod, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "1m": "Último mês",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  "12m": "Último ano",
};

export class ReportService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async getReportData(clinicId: string, period: ReportPeriod): Promise<ReportData> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const months = PERIOD_MONTHS[period];
    const startDate = now.subtract(months, "month").startOf("month").toDate();

    const [appointments, financials] = await Promise.all([
      this.repository.getAppointmentsInPeriod(clinicId, startDate),
      this.repository.getFinancialRecordsInPeriod(clinicId, startDate),
    ]);

    // Lista ordenada de chaves "YYYY-MM" para o período
    const monthKeys: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      monthKeys.push(now.subtract(i, "month").format("YYYY-MM"));
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const cancelledStatuses = new Set<AppointmentStatus>([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]);

    const consultationsCount = appointments.filter((a) => !cancelledStatuses.has(a.status as AppointmentStatus)).length;
    const cancellationsCount = appointments.filter((a) => cancelledStatuses.has(a.status as AppointmentStatus)).length;

    const totalRevenue = financials
      .filter((f) => f.type === TransactionType.INCOME)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const totalExpense = financials
      .filter((f) => f.type === TransactionType.EXPENSE)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const estimatedProfit = totalRevenue - totalExpense;

    // ── Agrupamento de consultas por mês ─────────────────────────────────────
    const apptByMonth: Record<string, { consultations: number; cancellations: number }> = {};
    for (const key of monthKeys) {
      apptByMonth[key] = { consultations: 0, cancellations: 0 };
    }

    for (const a of appointments) {
      const key = dayjs(a.appointmentDate).format("YYYY-MM");
      if (!apptByMonth[key]) continue;
      if (cancelledStatuses.has(a.status as AppointmentStatus)) {
        apptByMonth[key].cancellations++;
      } else {
        apptByMonth[key].consultations++;
      }
    }

    // ── Agrupamento financeiro por mês ───────────────────────────────────────
    const finByMonth: Record<string, { entradas: number; saidas: number }> = {};
    for (const key of monthKeys) {
      finByMonth[key] = { entradas: 0, saidas: 0 };
    }

    for (const f of financials) {
      const key = dayjs(f.referenceDate).format("YYYY-MM");
      if (!finByMonth[key]) continue;
      if (f.type === TransactionType.INCOME) {
        finByMonth[key].entradas += Number(f.amount);
      } else {
        finByMonth[key].saidas += Number(f.amount);
      }
    }

    // ── monthly ──────────────────────────────────────────────────────────────
    const monthly = monthKeys.map((key) => {
      const monthNum = Number(key.split("-")[1]);
      return {
        month: PT_MONTHS[monthNum],
        consultations: apptByMonth[key].consultations,
        cancellations: apptByMonth[key].cancellations,
        revenue: finByMonth[key].entradas,
      };
    });

    // ── financial ────────────────────────────────────────────────────────────
    const financial = monthKeys.map((key) => {
      const monthNum = Number(key.split("-")[1]);
      const { entradas, saidas } = finByMonth[key];
      return {
        month: PT_MONTHS[monthNum],
        entradas,
        saidas,
        lucro: entradas - saidas,
      };
    });

    // ── revenueTrend ─────────────────────────────────────────────────────────
    const revenueTrend = monthKeys.map((key) => {
      const monthNum = Number(key.split("-")[1]);
      return {
        month: PT_MONTHS[monthNum],
        consultations: apptByMonth[key].consultations,
        revenue: finByMonth[key].entradas,
      };
    });

    // ── statusDistribution ───────────────────────────────────────────────────
    const confirmedStatuses = new Set<AppointmentStatus>([
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.WAITING,
    ]);
    const pendingStatuses = new Set<AppointmentStatus>([AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED]);

    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;

    for (const a of appointments) {
      const status = a.status as AppointmentStatus;
      if (confirmedStatuses.has(status)) confirmed++;
      else if (pendingStatuses.has(status)) pending++;
      else if (cancelledStatuses.has(status)) cancelled++;
    }

    const statusDistribution = [
      { name: "Confirmados", value: confirmed },
      { name: "Pendentes", value: pending },
      { name: "Cancelados", value: cancelled },
    ];

    // ── topProfessionals ─────────────────────────────────────────────────────
    const profMap: Record<string, { name: string; specialty: string; count: number }> = {};

    for (const a of appointments) {
      const id = a.professionalId;
      if (!profMap[id]) {
        const name = a.professional.user.name;
        const specialty = a.professional.specialties[0]?.specialty.name ?? "Sem especialidade";
        profMap[id] = { name, specialty, count: 0 };
      }
      profMap[id].count++;
    }

    const topProfessionals = Object.values(profMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        specialty: p.specialty,
        consultations: p.count,
      }));

    // ── topSpecialties ───────────────────────────────────────────────────────
    const specMap: Record<string, number> = {};

    for (const a of appointments) {
      const specName = a.professional.specialties[0]?.specialty.name ?? "Sem especialidade";
      specMap[specName] = (specMap[specName] ?? 0) + 1;
    }

    const topSpecialties = Object.entries(specMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], i) => ({
        rank: i + 1,
        name,
        consultations: count,
      }));

    return {
      summary: { consultationsCount, totalRevenue, cancellationsCount, estimatedProfit },
      monthly,
      financial,
      statusDistribution,
      revenueTrend,
      topProfessionals,
      topSpecialties,
      referenceLabel: PERIOD_LABELS[period],
    };
  }
}
