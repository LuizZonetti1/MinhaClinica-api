import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ProfessionalDashboardRepository } from "../../repository/professionalDashboardRepository";
import type {
  ProfessionalAgendaItem,
  ProfessionalAgendaResponse,
  ProfessionalDashboardSummary,
} from "../../types/dashboard";
import { AppointmentType, type AppointmentType as AppointmentTypeType } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const APPOINTMENT_TYPE_LABELS: Record<AppointmentTypeType, string> = {
  [AppointmentType.CONSULTATION]: "Consulta",
  [AppointmentType.RETURN]: "Retorno",
  [AppointmentType.EXAM]: "Exame",
  [AppointmentType.EMERGENCY]: "Emergência",
};

export class ProfessionalDashboardService {
  private repository = new ProfessionalDashboardRepository();

  async execute(userId: string, clinicId: string): Promise<ProfessionalDashboardSummary> {
    const professional = await this.repository.findProfessionalByUserId(userId, clinicId);

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const startOfDay = now.startOf("day").toDate();
    const endOfDay = now.endOf("day").toDate();
    const startOfMonth = now.startOf("month").toDate();
    const endOfMonth = now.endOf("month").toDate();

    const [consultasHoje, confirmadas, pacientesDoMes] = await Promise.all([
      this.repository.countTodayAppointments(professional.id, startOfDay, endOfDay),
      this.repository.countConfirmedToday(professional.id, startOfDay, endOfDay),
      this.repository.countCompletedPatientsThisMonth(professional.id, startOfMonth, endOfMonth),
    ]);

    return {
      date: now.format("YYYY-MM-DD"),
      consultasHoje,
      confirmadas,
      pacientesDoMes,
    };
  }
}

export class ProfessionalAgendaService {
  private repository = new ProfessionalDashboardRepository();

  private validateDate(dateStr: string): dayjs.Dayjs {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw Object.assign(new Error("Parâmetro 'date' deve estar no formato YYYY-MM-DD"), {
        statusCode: 400,
      });
    }

    const parsed = dayjs.tz(dateStr, DEFAULT_TIMEZONE);

    if (!parsed.isValid()) {
      throw Object.assign(new Error("Data inválida"), { statusCode: 400 });
    }

    const today = dayjs().tz(DEFAULT_TIMEZONE).startOf("day");
    const diffDays = parsed.startOf("day").diff(today, "day");

    if (diffDays < -31 || diffDays > 31) {
      throw Object.assign(
        new Error("A data deve estar no intervalo de 1 mês antes ou depois do dia atual"),
        { statusCode: 400 },
      );
    }

    return parsed;
  }

  async execute(
    userId: string,
    clinicId: string,
    dateStr?: string,
  ): Promise<ProfessionalAgendaResponse> {
    const professional = await this.repository.findProfessionalByUserId(userId, clinicId);

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const day = dateStr ? this.validateDate(dateStr) : dayjs().tz(DEFAULT_TIMEZONE);
    const startOfDay = day.startOf("day").toDate();
    const endOfDay = day.endOf("day").toDate();

    const raw = await this.repository.listAppointmentsByDate(professional.id, startOfDay, endOfDay);

    const appointments: ProfessionalAgendaItem[] = raw.map((apt) => ({
      id: apt.id,
      time: apt.startTime,
      endTime: apt.endTime,
      patientName: apt.patient.user.name,
      patientAvatarUrl: apt.patient.user.avatarUrl,
      appointmentType: APPOINTMENT_TYPE_LABELS[apt.type as AppointmentTypeType] ?? apt.type,
      status: apt.status,
      notes: apt.notes ?? null,
    }));

    return {
      date: day.format("YYYY-MM-DD"),
      appointments,
    };
  }
}
