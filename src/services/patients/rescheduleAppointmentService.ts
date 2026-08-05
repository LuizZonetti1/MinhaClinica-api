import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import { ProcedureRepository } from "../../repository/procedureRepository";
import { AppointmentChannel, AppointmentStatus, DayOfWeek } from "../../types/enums";
import type { PatientRescheduleInput, PatientRescheduleResult } from "../../types/patient";
import { resolveAppointmentDuration } from "../../utils/resolveAppointmentDuration";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// Dias da semana: Date.getDay() → DayOfWeek (mesmo mapeamento de getAvailableSlotsService)
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

const DEFAULT_ALLOWED_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
] as string[];

export interface RescheduleOptions {
  /** Quando informado, exige que o agendamento pertença a este paciente (fluxo do paciente). */
  ownerUserId?: string;
  /** Status de origem aceitos. Padrão: SCHEDULED, CONFIRMED (comportamento atual do paciente). */
  allowedStatuses?: string[];
}

export class RescheduleAppointmentService {
  private repository = new PatientDashboardRepository();
  private procedureRepository = new ProcedureRepository();

  async execute(
    appointmentId: string,
    actorUserId: string,
    input: PatientRescheduleInput,
    options: RescheduleOptions = {},
  ): Promise<PatientRescheduleResult> {
    const { ownerUserId, allowedStatuses = DEFAULT_ALLOWED_STATUSES } = options;

    // Busca o agendamento original. Modo paciente (ownerUserId informado) exige
    // posse; modo clínica (recepção) só exige o tenant.
    const original = await this.repository.findAppointmentForReschedule(
      appointmentId,
      input.clinicId,
      ownerUserId,
    );

    if (!original) {
      throw Object.assign(new Error("Agendamento não encontrado"), { statusCode: 404 });
    }

    if (!allowedStatuses.includes(original.status)) {
      throw Object.assign(
        new Error(`Só é possível remarcar consultas com status ${allowedStatuses.join(", ")}`),
        { statusCode: 400 },
      );
    }

    // Busca duração do profissional
    const professional = await prisma.professional.findFirst({
      where: { id: input.professionalId, clinicId: input.clinicId, isActive: true },
      select: { defaultAppointmentDuration: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado ou inativo"), {
        statusCode: 404,
      });
    }

    // O profissional precisa atender no dia da semana da nova data. Checagem
    // mínima (não recalcula horários/blocks — isso é feito em
    // getAvailableSlotsService, fora do escopo deste serviço).
    const dayOfWeek = JS_DAY_TO_ENUM[dayjs.tz(input.appointmentDate, DEFAULT_TIMEZONE).day()];
    const workingDay = await prisma.professionalWorkingHours.findFirst({
      where: {
        professionalId: input.professionalId,
        dayOfWeek,
        isWorking: true,
      },
      select: { id: true },
    });

    if (!workingDay) {
      throw Object.assign(new Error("O profissional não atende neste dia da semana."), {
        statusCode: 400,
      });
    }

    // Preserva a duração do procedimento original (se houver) também no reagendamento,
    // inclusive quando o novo profissional tem customDuration próprio para ele.
    const procedureData = original.procedureId
      ? await this.procedureRepository.findDurationInputs(
          original.procedureId,
          input.professionalId,
          input.clinicId,
        )
      : null;

    const duration = resolveAppointmentDuration({
      professionalDefaultDuration: professional.defaultAppointmentDuration,
      procedureDefaultDuration: procedureData?.defaultDuration,
      customDuration: procedureData?.professionals[0]?.customDuration,
    });

    const startMinutes = timeToMinutes(input.startTime);
    const endTime = minutesToTime(startMinutes + duration);

    // Valida que a nova data/hora é futura
    const newDatetime = dayjs
      .tz(input.appointmentDate, DEFAULT_TIMEZONE)
      .hour(Math.floor(startMinutes / 60))
      .minute(startMinutes % 60)
      .second(0)
      .millisecond(0);

    if (newDatetime.isBefore(dayjs().tz(DEFAULT_TIMEZONE))) {
      throw Object.assign(new Error("Não é permitido remarcar para um horário já passado"), {
        statusCode: 400,
      });
    }

    // appointmentDate é @db.Date → UTC midnight para comparação correta
    const startOfDay = dayjs.utc(input.appointmentDate).startOf("day").toDate();
    const endOfDay = dayjs.utc(input.appointmentDate).endOf("day").toDate();

    const hasConflict = await this.repository.hasConflictExcluding(
      appointmentId,
      input.professionalId,
      input.clinicId,
      startOfDay,
      endOfDay,
      input.startTime,
      endTime,
    );

    if (hasConflict) {
      throw Object.assign(new Error("Este horário já está ocupado. Por favor, escolha outro."), {
        statusCode: 409,
      });
    }

    // Marca o original como RESCHEDULED e cria o novo em transação atômica
    const appointmentDate = dayjs
      .tz(input.appointmentDate, DEFAULT_TIMEZONE)
      .startOf("day")
      .toDate();

    const newAppointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.RESCHEDULED },
      });

      return tx.appointment.create({
        data: {
          clinicId: input.clinicId,
          patientId: original.patientId,
          professionalId: input.professionalId,
          procedureId: original.procedureId ?? undefined,
          appointmentDate,
          startTime: input.startTime,
          endTime,
          duration,
          type: original.type,
          channel: (original.channel as AppointmentChannel) ?? AppointmentChannel.IN_PERSON,
          notes: original.notes ?? undefined,
          createdBy: actorUserId,
        },
        select: { id: true, appointmentDate: true, startTime: true, endTime: true },
      });
    });

    return {
      id: newAppointment.id,
      appointmentDate: dayjs.utc(newAppointment.appointmentDate).format("YYYY-MM-DD"),
      startTime: newAppointment.startTime,
      endTime: newAppointment.endTime,
    };
  }
}
