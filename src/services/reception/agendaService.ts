import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReceptionDashboardRepository } from "../../repository/receptionDashboardRepository";
import type { AgendaResponse, AgendaSlot, ProfessionalAgenda } from "../../types/dashboard";
import { DayOfWeek } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_WORK_START = "08:00";
const DEFAULT_WORK_END = "18:00";

// dayjs getDay() → DayOfWeek
const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export class GetProfessionalsAgendaService {
  private repository = new ReceptionDashboardRepository();

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

  async execute(clinicId: string, dateStr?: string): Promise<AgendaResponse> {
    const day = dateStr ? this.validateDate(dateStr) : dayjs().tz(DEFAULT_TIMEZONE);

    const dateFormatted = day.format("YYYY-MM-DD");
    const startOfDay = day.startOf("day").toDate();
    const endOfDay = day.endOf("day").toDate();
    const dayOfWeek = JS_DAY_TO_ENUM[day.day()];

    const professionals = await this.repository.listProfessionalsWithAgendaData(
      clinicId,
      dayOfWeek,
      startOfDay,
      endOfDay,
    );

    const result: ProfessionalAgenda[] = professionals.map((prof) => {
      const wh = prof.workingHours[0] ?? null;
      const workStart = timeToMinutes(wh?.startTime ?? DEFAULT_WORK_START);
      const workEnd = timeToMinutes(wh?.endTime ?? DEFAULT_WORK_END);
      const duration = prof.defaultAppointmentDuration;
      const buffer = prof.bufferTime;
      const step = duration + buffer;

      const lunchStart = wh?.lunchBreakStart != null ? timeToMinutes(wh.lunchBreakStart) : null;
      const lunchEnd = wh?.lunchBreakEnd != null ? timeToMinutes(wh.lunchBreakEnd) : null;

      // Mapear agendamentos por horário de início
      const appointmentsByTime = new Map(prof.appointments.map((apt) => [apt.startTime, apt]));

      // Se o profissional não trabalha nesse dia, retornar lista vazia
      if (!wh) {
        return {
          id: prof.id,
          name: prof.user.name,
          specialty: prof.specialties[0]?.specialty.name ?? null,
          avatarUrl: prof.user.avatarUrl,
          slots: [],
        };
      }

      const slots: AgendaSlot[] = [];
      let current = workStart;

      while (current + duration <= workEnd) {
        const time = minutesToTime(current);

        const inLunch =
          lunchStart !== null && lunchEnd !== null && current >= lunchStart && current < lunchEnd;

        if (!inLunch) {
          const apt = appointmentsByTime.get(time);

          if (apt) {
            slots.push({
              time,
              libre: false,
              appointmentId: apt.id,
              patientName: apt.patient.user.name,
              status: apt.status,
            });
          } else {
            slots.push({ time, libre: true });
          }
        }

        current += step;
      }

      return {
        id: prof.id,
        name: prof.user.name,
        specialty: prof.specialties[0]?.specialty.name ?? null,
        avatarUrl: prof.user.avatarUrl,
        slots,
      };
    });

    return { date: dateFormatted, professionals: result };
  }
}
