import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { ClinicRepository } from "../../repository/clinicRepository";
import { DayOfWeek } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

// Espelham os @default do model ClinicSettings (prisma/schema.prisma) para
// clínicas sem linha de settings ainda criada.
const DEFAULT_MIN_ADVANCE_BOOKING_HOURS = 2;
const DEFAULT_MAX_ADVANCE_BOOKING_DAYS = 60;

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

function bookingError(message: string) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

/**
 * Regras que valem para o DIA inteiro (não dependem do horário escolhido):
 * feriado e janela máxima de antecedência.
 *
 * Compartilhado entre GetAvailableSlotsService e assertSlotIsBookable de
 * propósito: quando só a criação conhecia essas regras, /slots oferecia
 * horários em feriado que o POST rejeitava — o paciente clicava num horário
 * "disponível" e tomava erro. É o mesmo defeito de "camadas desconectadas"
 * que o V5 se propôs a corrigir, só que na direção oposta.
 */
export async function findDateLevelBlock(
  clinicId: string,
  dateStr: string,
): Promise<{ reason: "HOLIDAY" | "OUTSIDE_BOOKING_WINDOW"; message: string } | null> {
  const settings = await new ClinicRepository().findSettingsByClinicId(clinicId);
  const dayjsDate = dayjs.tz(dateStr, DEFAULT_TIMEZONE);
  const now = dayjs().tz(DEFAULT_TIMEZONE);

  const maxAdvanceDays = settings?.maxAdvanceBookingDays ?? DEFAULT_MAX_ADVANCE_BOOKING_DAYS;
  const daysAhead = dayjsDate.startOf("day").diff(now.startOf("day"), "day");
  if (daysAhead > maxAdvanceDays) {
    return {
      reason: "OUTSIDE_BOOKING_WINDOW",
      message: `Não é possível agendar com mais de ${maxAdvanceDays} dia(s) de antecedência.`,
    };
  }

  // Feriado (ClinicHoliday) — data fixa ou recorrente (mesmo dia/mês, ano livre).
  const holidays = await prisma.clinicHoliday.findMany({
    where: { clinicId },
    select: { date: true, description: true, isRecurring: true },
  });
  const targetDateUtc = dayjs.utc(dateStr);
  const holiday = holidays.find((h) => {
    const hDate = dayjs.utc(h.date);
    return h.isRecurring
      ? hDate.month() === targetDateUtc.month() && hDate.date() === targetDateUtc.date()
      : hDate.isSame(targetDateUtc, "day");
  });
  if (holiday) {
    return { reason: "HOLIDAY", message: `Data indisponível: feriado (${holiday.description}).` };
  }

  return null;
}

export interface AssertSlotIsBookableParams {
  clinicId: string;
  professionalId: string;
  /** Data no formato YYYY-MM-DD (mesmo formato aceito em toda a Etapa 3 de agendamento). */
  dateStr: string;
  startTime: string;
  endTime: string;
  /** true quando o próprio paciente está criando/remarcando pelo portal (gate de allowOnlineBooking). */
  isOnlineBooking: boolean;
}

/**
 * Ponto único de validação das regras de agendamento que antes só existiam
 * (parcialmente) em GetAvailableSlotsService, sem nenhuma ligação com os
 * pontos de criação/reagendamento — dois caminhos de código desconectados.
 * CreateAppointmentService/RescheduleAppointmentService só checavam conflito
 * de horário e data passada; feriado, horário de trabalho,
 * ProfessionalScheduleBlock, antecedência mínima/máxima e allowOnlineBooking
 * nunca eram barrados no servidor. Ver V5 do PLANO_CORRECOES_RODADA5.md.
 *
 * Não cobre checagem de conflito de horário (fica no repository, perto do
 * create/update em transação — ver hasConflict/hasConflictExcluding).
 */
export async function assertSlotIsBookable(params: AssertSlotIsBookableParams): Promise<void> {
  const { clinicId, professionalId, dateStr, startTime, endTime, isOnlineBooking } = params;

  const settings = await new ClinicRepository().findSettingsByClinicId(clinicId);

  const dayjsDate = dayjs.tz(dateStr, DEFAULT_TIMEZONE);
  const now = dayjs().tz(DEFAULT_TIMEZONE);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const appointmentStart = dayjsDate
    .hour(Math.floor(startMinutes / 60))
    .minute(startMinutes % 60)
    .second(0)
    .millisecond(0);

  // allowOnlineBooking — só se aplica quando o próprio paciente está agendando.
  if (isOnlineBooking && settings?.allowOnlineBooking === false) {
    throw bookingError(
      "Agendamento online desativado para esta clínica. Entre em contato com a recepção.",
    );
  }

  // minAdvanceBookingHours é política de agendamento ONLINE ("agende com X
  // horas de antecedência"). Aplicá-la ao staff quebraria o balcão: a
  // recepção precisa conseguir encaixar o paciente que está ali agora.
  // Para staff vale só a regra de sempre: não agendar no passado.
  if (isOnlineBooking) {
    const minAdvanceHours = settings?.minAdvanceBookingHours ?? DEFAULT_MIN_ADVANCE_BOOKING_HOURS;
    if (appointmentStart.isBefore(now.add(minAdvanceHours, "hour"))) {
      throw bookingError(
        minAdvanceHours > 0
          ? `É necessário agendar com pelo menos ${minAdvanceHours} hora(s) de antecedência.`
          : "Não é permitido agendar em horário já passado.",
      );
    }
  } else if (appointmentStart.isBefore(now)) {
    throw bookingError("Não é permitido agendar em horário já passado.");
  }

  // maxAdvanceBookingDays + feriado — mesma função consumida por
  // GetAvailableSlotsService, para os dois caminhos nunca divergirem.
  const dateBlock = await findDateLevelBlock(clinicId, dateStr);
  if (dateBlock) {
    throw bookingError(dateBlock.message);
  }

  // Horário de trabalho / dia não trabalhado (ProfessionalWorkingHours)
  const dayOfWeek = JS_DAY_TO_ENUM[dayjsDate.day()];
  const workingHours = await prisma.professionalWorkingHours.findFirst({
    where: { professionalId, dayOfWeek, isWorking: true },
    select: { startTime: true, endTime: true, lunchBreakStart: true, lunchBreakEnd: true },
  });
  if (!workingHours) {
    throw bookingError("O profissional não atende neste dia da semana.");
  }
  const workStart = timeToMinutes(workingHours.startTime);
  const workEnd = timeToMinutes(workingHours.endTime);
  if (startMinutes < workStart || endMinutes > workEnd) {
    throw bookingError("Horário fora do expediente do profissional.");
  }
  if (workingHours.lunchBreakStart && workingHours.lunchBreakEnd) {
    const lunchStart = timeToMinutes(workingHours.lunchBreakStart);
    const lunchEnd = timeToMinutes(workingHours.lunchBreakEnd);
    if (startMinutes < lunchEnd && endMinutes > lunchStart) {
      throw bookingError("Horário conflita com o intervalo de almoço do profissional.");
    }
  }

  // ProfessionalScheduleBlock (férias/folgas)
  const startOfDay = dayjs.utc(dateStr).startOf("day").toDate();
  const endOfDay = dayjs.utc(dateStr).endOf("day").toDate();
  const blocks = await prisma.professionalScheduleBlock.findMany({
    where: {
      professionalId,
      startDateTime: { lte: endOfDay },
      endDateTime: { gte: startOfDay },
    },
    select: { startDateTime: true, endDateTime: true, isAllDay: true, reason: true },
  });
  const appointmentEnd = appointmentStart.add(endMinutes - startMinutes, "minute");
  const block = blocks.find((b) => {
    if (b.isAllDay) return true;
    return (
      appointmentStart.isBefore(dayjs(b.endDateTime)) &&
      appointmentEnd.isAfter(dayjs(b.startDateTime))
    );
  });
  if (block) {
    throw bookingError(`Agenda bloqueada neste horário: ${block.reason}.`);
  }
}
