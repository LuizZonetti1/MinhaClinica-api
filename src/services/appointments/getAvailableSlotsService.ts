import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { AvailableSlotsResult, TimeSlot } from "../../types/appointment";
import { DayOfWeek } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_WORK_START = "08:00";
const DEFAULT_WORK_END = "18:00";

// Dias da semana: Date.getDay() → DayOfWeek
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

export class GetAvailableSlotsService {
  private repository = new AppointmentRepository();

  async execute(
    professionalId: string,
    clinicId: string,
    dateStr: string,
  ): Promise<AvailableSlotsResult> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw Object.assign(new Error("Data deve estar no formato YYYY-MM-DD"), { statusCode: 400 });
    }

    // Intervalo do dia no fuso local — para queries
    const dayjsDate = dayjs.tz(dateStr, DEFAULT_TIMEZONE);
    const startOfDay = dayjsDate.startOf("day").toDate();
    const endOfDay = dayjsDate.endOf("day").toDate();

    const dayOfWeek = JS_DAY_TO_ENUM[dayjsDate.day()];
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const isPastDate = dayjsDate.isBefore(now, "day");
    const isToday = dayjsDate.isSame(now, "day");
    const nowMinutes = now.hour() * 60 + now.minute();

    const { professional, workingHours, scheduleBlocks, appointments } =
      await this.repository.getProfessionalScheduleData(
        professionalId,
        clinicId,
        dayOfWeek,
        startOfDay,
        endOfDay,
      );

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const duration = professional.defaultAppointmentDuration;
    const bufferTime = professional.bufferTime;

    // Definir range de trabalho
    const workStart = timeToMinutes(workingHours?.startTime ?? DEFAULT_WORK_START);
    const workEnd = timeToMinutes(workingHours?.endTime ?? DEFAULT_WORK_END);

    // Lunch break (se configurado)
    const lunchStart =
      workingHours?.lunchBreakStart != null ? timeToMinutes(workingHours.lunchBreakStart) : null;
    const lunchEnd =
      workingHours?.lunchBreakEnd != null ? timeToMinutes(workingHours.lunchBreakEnd) : null;

    // Converter bloqueios de agenda para ranges de minutos do dia
    const blockedRanges: { start: number; end: number }[] = [];

    for (const block of scheduleBlocks) {
      if (block.isAllDay) {
        // Dia inteiro bloqueado — bloqueia todo o workRange
        blockedRanges.push({ start: 0, end: 24 * 60 });
      } else {
        const blockStart = dayjs(block.startDateTime).tz(DEFAULT_TIMEZONE);
        const blockEnd = dayjs(block.endDateTime).tz(DEFAULT_TIMEZONE);
        blockedRanges.push({
          start: blockStart.hour() * 60 + blockStart.minute(),
          end: blockEnd.hour() * 60 + blockEnd.minute(),
        });
      }
    }

    // Converter agendamentos existentes para ranges de minutos
    for (const apt of appointments) {
      blockedRanges.push({
        start: timeToMinutes(apt.startTime),
        end: timeToMinutes(apt.endTime),
      });
    }

    // Gerar todos os slots do dia
    const slots: TimeSlot[] = [];
    const step = duration + bufferTime;
    let current = workStart;

    while (current + duration <= workEnd) {
      const slotEnd = current + duration;

      const inLunch =
        lunchStart !== null && lunchEnd !== null && current < lunchEnd && slotEnd > lunchStart;

      const isBlocked = blockedRanges.some((b) => current < b.end && slotEnd > b.start);
      const isPastTime = isPastDate || (isToday && current < nowMinutes);

      slots.push({
        startTime: minutesToTime(current),
        endTime: minutesToTime(slotEnd),
        available: !inLunch && !isBlocked && !isPastTime,
      });

      current += step;
    }

    return {
      date: dateStr,
      professionalId,
      duration,
      bufferTime,
      slots,
    };
  }
}
