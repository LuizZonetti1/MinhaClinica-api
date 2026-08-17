import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Prisma } from "../../../generated/prisma";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import { ProcedureRepository } from "../../repository/procedureRepository";
import { AppointmentChannel, AppointmentStatus } from "../../types/enums";
import type { PatientRescheduleInput, PatientRescheduleResult } from "../../types/patient";
import { resolveAppointmentDuration } from "../../utils/resolveAppointmentDuration";
import { assertSlotIsBookable } from "../appointments/appointmentBookingRules";

dayjs.extend(utc);
dayjs.extend(timezone);

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

    // Feriado, horário de trabalho, ProfessionalScheduleBlock, antecedência
    // mínima/máxima e allowOnlineBooking (só quando o próprio paciente remarca
    // pelo portal) — inclui a checagem de "não pode ser no passado".
    await assertSlotIsBookable({
      clinicId: input.clinicId,
      professionalId: input.professionalId,
      dateStr: input.appointmentDate,
      startTime: input.startTime,
      endTime,
      isOnlineBooking: Boolean(ownerUserId),
    });

    // appointmentDate é @db.Date → UTC midnight para comparação correta
    const startOfDay = dayjs.utc(input.appointmentDate).startOf("day").toDate();
    const endOfDay = dayjs.utc(input.appointmentDate).endOf("day").toDate();

    const appointmentDate = dayjs
      .tz(input.appointmentDate, DEFAULT_TIMEZONE)
      .startOf("day")
      .toDate();

    // Conflito + update + create numa única transação Serializable — duas
    // remarcações concorrentes para o mesmo slot não passam mais ambas.
    let newAppointment: Awaited<ReturnType<PatientDashboardRepository["rescheduleIfNoConflict"]>>;
    try {
      newAppointment = await this.repository.rescheduleIfNoConflict({
        appointmentId,
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
        startOfDay,
        endOfDay,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw Object.assign(new Error("Este horário já está ocupado. Por favor, escolha outro."), {
          statusCode: 409,
        });
      }
      throw error;
    }

    return {
      id: newAppointment.id,
      appointmentDate: dayjs.utc(newAppointment.appointmentDate).format("YYYY-MM-DD"),
      startTime: newAppointment.startTime,
      endTime: newAppointment.endTime,
    };
  }
}
