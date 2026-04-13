import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentChannel, AppointmentStatus } from "../../types/enums";

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

export interface RescheduleInput {
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  clinicId: string;
  professionalId: string;
}

export interface RescheduleResult {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

export class RescheduleAppointmentService {
  async execute(
    appointmentId: string,
    userId: string,
    input: RescheduleInput,
  ): Promise<RescheduleResult> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.appointmentDate)) {
      throw Object.assign(new Error("appointmentDate deve estar no formato YYYY-MM-DD"), {
        statusCode: 400,
      });
    }

    if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
      throw Object.assign(new Error("startTime deve estar no formato HH:mm"), {
        statusCode: 400,
      });
    }

    // Busca o agendamento original verificando posse pelo userId
    const original = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: input.clinicId,
        patient: { userId },
      },
      select: {
        id: true,
        status: true,
        type: true,
        notes: true,
        patientId: true,
        channel: true,
        procedureId: true,
      },
    });

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
    if (Number.isNaN(startMinutes) || startMinutes < 0 || startMinutes >= 24 * 60) {
      throw Object.assign(new Error("startTime inválido"), { statusCode: 400 });
    }

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

    const endTime = minutesToTime(startMinutes + professional.defaultAppointmentDuration);

    // Verifica conflito no novo horário (excluindo o próprio agendamento)
    const dayjsDate = dayjs.tz(input.appointmentDate, DEFAULT_TIMEZONE);
    const startOfDay = dayjs.utc(input.appointmentDate).startOf("day").toDate();
    const endOfDay = dayjs.utc(input.appointmentDate).endOf("day").toDate();

    const conflictCount = await prisma.appointment.count({
      where: {
        id: { not: appointmentId },
        professionalId: input.professionalId,
        clinicId: input.clinicId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: {
          notIn: [
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
            AppointmentStatus.RESCHEDULED,
          ],
        },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: input.startTime } }],
      },
    });

    if (conflictCount > 0) {
      throw Object.assign(
        new Error("Este horário já está ocupado. Por favor, escolha outro."),
        { statusCode: 409 },
      );
    }

    // Cancela o original com status RESCHEDULED e cria o novo em transação
    const newAppointment = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.RESCHEDULED },
      });

      const appointmentDate = dayjsDate.startOf("day").toDate();

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
      appointmentDate: dayjs(newAppointment.appointmentDate).format("YYYY-MM-DD"),
      startTime: newAppointment.startTime,
      endTime: newAppointment.endTime,
    };
  }
}
