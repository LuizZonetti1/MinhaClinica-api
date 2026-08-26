import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import { ProcedureRepository } from "../../repository/procedureRepository";
import type {
  AvailableSlotsResult,
  SlotsUnavailableReason,
  TimeSlot,
} from "../../types/appointment";
import { DayOfWeek } from "../../types/enums";
import { resolveAppointmentDuration } from "../../utils/resolveAppointmentDuration";
import { findDateLevelBlock, getOnlineBookingPolicy } from "./appointmentBookingRules";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  private procedureRepository = new ProcedureRepository();

  async execute(
    professionalId: string,
    clinicId: string,
    dateStr: string,
    procedureId?: string,
    /**
     * true quando a consulta vem do portal do paciente. Ativa as mesmas
     * regras de agendamento online que assertSlotIsBookable aplica na
     * criação (allowOnlineBooking e minAdvanceBookingHours) — sem isso o
     * portal ofertava horário que o POST recusava.
     */
    isOnlineBooking = false,
  ): Promise<AvailableSlotsResult> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw Object.assign(new Error("Data deve estar no formato YYYY-MM-DD"), { statusCode: 400 });
    }

    // appointmentDate é @db.Date → Prisma retorna UTC midnight.
    // Usar UTC para o range das queries e SP para lógica de dia da semana/hora.
    const dayjsDate = dayjs.tz(dateStr, DEFAULT_TIMEZONE);
    const startOfDay = dayjs.utc(dateStr).startOf("day").toDate();
    const endOfDay = dayjs.utc(dateStr).endOf("day").toDate();

    // Feriado / fora da janela de antecedência valem para o dia inteiro e são
    // avaliados pela MESMA função que a criação usa (findDateLevelBlock) —
    // antes disso, /slots oferecia horários em feriado que o POST rejeitava.
    const dateBlock = await findDateLevelBlock(clinicId, dateStr);

    // Portal do paciente: allowOnlineBooking + antecedência mínima.
    const onlinePolicy = isOnlineBooking ? await getOnlineBookingPolicy(clinicId) : null;

    const dayOfWeek = JS_DAY_TO_ENUM[dayjsDate.day()];
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const isPastDate = dayjsDate.isBefore(now, "day");
    const isToday = dayjsDate.isSame(now, "day");
    const nowMinutes = now.hour() * 60 + now.minute();

    // Comparado como datetime (não só minutos do dia) para a janela poder
    // atravessar a virada do dia — ex.: 23:00 + 2h alcança o dia seguinte.
    const earliestOnlineStart = onlinePolicy
      ? now.add(onlinePolicy.minAdvanceBookingHours, "hour")
      : null;

    const { professional, workingHours, scheduleBlocks, appointments, activeWorkingDaysCount } =
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

    // procedureId inválido para esta clínica/profissional é ignorado aqui (não é
    // endpoint de mutação): cai no fallback de duração padrão do profissional,
    // igual ao comportamento de antes de a Etapa 4 existir.
    const procedureData = procedureId
      ? await this.procedureRepository.findDurationInputs(procedureId, professionalId, clinicId)
      : null;

    const duration = resolveAppointmentDuration({
      professionalDefaultDuration: professional.defaultAppointmentDuration,
      procedureDefaultDuration: procedureData?.defaultDuration,
      customDuration: procedureData?.professionals[0]?.customDuration,
    });
    const bufferTime = professional.bufferTime;

    // Feriado / fora da janela: dia inteiro indisponível, nenhum slot ofertado
    if (dateBlock) {
      return {
        date: dateStr,
        professionalId,
        duration,
        bufferTime,
        slots: [],
        reason: dateBlock.reason,
      };
    }

    // Clínica desligou o agendamento online: o portal não oferta nada, em vez
    // de listar horários que o POST recusaria.
    if (onlinePolicy && !onlinePolicy.allowOnlineBooking) {
      return {
        date: dateStr,
        professionalId,
        duration,
        bufferTime,
        slots: [],
        reason: "ONLINE_BOOKING_DISABLED",
      };
    }

    // Profissional não trabalha nesse dia da semana (ou nunca configurou horários) → sem slots
    if (!workingHours) {
      const reason: SlotsUnavailableReason =
        activeWorkingDaysCount === 0 ? "NO_WORKING_HOURS" : "DAY_OFF";
      return {
        date: dateStr,
        professionalId,
        duration,
        bufferTime,
        slots: [],
        reason,
      };
    }

    // Definir range de trabalho
    const workStart = timeToMinutes(workingHours.startTime);
    const workEnd = timeToMinutes(workingHours.endTime);

    // Lunch break (se configurado)
    const lunchStart =
      workingHours.lunchBreakStart != null ? timeToMinutes(workingHours.lunchBreakStart) : null;
    const lunchEnd =
      workingHours.lunchBreakEnd != null ? timeToMinutes(workingHours.lunchBreakEnd) : null;

    // Converter bloqueios de agenda para ranges de minutos do dia.
    // Ficam separados dos agendamentos porque a origem da indisponibilidade
    // muda a mensagem: bloqueio tem motivo declarado, horário ocupado não.
    const scheduleBlockRanges: { start: number; end: number }[] = [];

    for (const block of scheduleBlocks) {
      if (block.isAllDay) {
        // Dia inteiro bloqueado — bloqueia todo o workRange
        scheduleBlockRanges.push({ start: 0, end: 24 * 60 });
      } else {
        const blockStart = dayjs(block.startDateTime).tz(DEFAULT_TIMEZONE);
        const blockEnd = dayjs(block.endDateTime).tz(DEFAULT_TIMEZONE);
        scheduleBlockRanges.push({
          start: blockStart.hour() * 60 + blockStart.minute(),
          end: blockEnd.hour() * 60 + blockEnd.minute(),
        });
      }
    }

    // Converter agendamentos existentes para ranges de minutos
    const appointmentRanges = appointments.map((apt) => ({
      start: timeToMinutes(apt.startTime),
      end: timeToMinutes(apt.endTime),
    }));

    // Gerar todos os slots do dia
    const slots: TimeSlot[] = [];
    const step = duration + bufferTime;
    let current = workStart;

    // Para escolher o motivo depois: se nenhum slot sobrou e tudo que caiu foi
    // por bloqueio de agenda, o dia está bloqueado — não "lotado".
    let hasAvailableSlot = false;
    let everyUnavailableSlotIsBlocked = true;

    while (current + duration <= workEnd) {
      const slotEnd = current + duration;

      const inLunch =
        lunchStart !== null && lunchEnd !== null && current < lunchEnd && slotEnd > lunchStart;

      const isBlocked = scheduleBlockRanges.some((b) => current < b.end && slotEnd > b.start);
      const isTaken = appointmentRanges.some((b) => current < b.end && slotEnd > b.start);
      const isPastTime = isPastDate || (isToday && current < nowMinutes);

      // No portal, a antecedência mínima empurra o primeiro horário ofertável
      // para frente — assertSlotIsBookable recusaria qualquer coisa antes disso.
      const isTooSoonForOnline = earliestOnlineStart
        ? dayjsDate
            .hour(Math.floor(current / 60))
            .minute(current % 60)
            .second(0)
            .millisecond(0)
            .isBefore(earliestOnlineStart)
        : false;

      const available = !inLunch && !isBlocked && !isTaken && !isPastTime && !isTooSoonForOnline;
      if (available) {
        hasAvailableSlot = true;
      } else if (!isBlocked) {
        everyUnavailableSlotIsBlocked = false;
      }

      slots.push({
        startTime: minutesToTime(current),
        endTime: minutesToTime(slotEnd),
        available,
      });

      current += step;
    }

    // Um bloqueio marcado isAllDay derruba o dia inteiro; um bloqueio por
    // intervalo pode derrubar o expediente todo sem ser isAllDay (foi o caso das
    // "férias" da auditoria). Nos dois casos o motivo é o bloqueio, não lotação.
    const isDateBlocked =
      scheduleBlocks.some((block) => block.isAllDay) ||
      (scheduleBlockRanges.length > 0 &&
        slots.length > 0 &&
        !hasAvailableSlot &&
        everyUnavailableSlotIsBlocked);

    let reason: SlotsUnavailableReason | undefined;
    if (isDateBlocked) {
      reason = "DATE_BLOCKED";
    } else if (isPastDate) {
      reason = "PAST_DATE";
    } else if (slots.length > 0 && !hasAvailableSlot) {
      reason = "FULLY_BOOKED";
    }

    // Motivos declarados nos bloqueios que tocam a data, sem repetir.
    const blockReason =
      scheduleBlocks.length > 0
        ? [...new Set(scheduleBlocks.map((block) => block.reason).filter(Boolean))].join(" · ") ||
          undefined
        : undefined;

    return {
      date: dateStr,
      professionalId,
      duration,
      bufferTime,
      slots,
      reason,
      blockReason,
    };
  }
}
