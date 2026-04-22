import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import { AppointmentChannel, AppointmentStatus } from "../../types/enums";
import type { PatientRescheduleInput, PatientRescheduleResult } from "../../types/patient";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export class RescheduleAppointmentService {
  private repository = new PatientDashboardRepository();

  async execute(
    appointmentId: string,
    userId: string,
    input: PatientRescheduleInput,
  ): Promise<PatientRescheduleResult> {
    // Busca o agendamento original verificando posse pelo userId e clinicId
    const original = await this.repository.findAppointmentForReschedule(
      appointmentId,
      userId,
      input.clinicId,
    );

    if (!original) {
      throw Object.assign(new Error("Agendamento não encontrado"), { statusCode: 404 });
    }

    const allowedStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] as string[];
    if (!allowedStatuses.includes(original.status)) {
      throw Object.assign(
        new Error("Só é possível remarcar consultas com status SCHEDULED ou CONFIRMED"),
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

    const startMinutes = timeToMinutes(input.startTime);
    const endTime = minutesToTime(startMinutes + professional.defaultAppointmentDuration);

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
          duration: professional.defaultAppointmentDuration,
          type: original.type,
          channel: (original.channel as AppointmentChannel) ?? AppointmentChannel.IN_PERSON,
          notes: original.notes ?? undefined,
          createdBy: userId,
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
