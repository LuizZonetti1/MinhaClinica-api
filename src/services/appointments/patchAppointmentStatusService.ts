import { prisma } from "../../database/prisma";
import { AppointmentStatus } from "../../types/enums";

/** Transições permitidas: de → para */
const ALLOWED_TRANSITIONS: Partial<Record<string, string>> = {
  [AppointmentStatus.SCHEDULED]: AppointmentStatus.IN_PROGRESS,
  [AppointmentStatus.CONFIRMED]: AppointmentStatus.IN_PROGRESS,
  [AppointmentStatus.WAITING]: AppointmentStatus.IN_PROGRESS,
};

export class PatchAppointmentStatusService {
  async execute(
    appointmentId: string,
    newStatus: string,
    userId: string,
    clinicId: string,
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    if (appointment.clinicId !== clinicId) {
      throw Object.assign(new Error("Acesso negado a esta consulta"), { statusCode: 403 });
    }

    if (appointment.professional.userId !== userId) {
      throw Object.assign(
        new Error("Apenas o profissional da consulta pode alterar o status"),
        { statusCode: 403 },
      );
    }

    const currentStatus = appointment.status as string;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedNext) {
      throw Object.assign(
        new Error(
          `Transição de status não permitida a partir de '${currentStatus}'`,
        ),
        { statusCode: 400 },
      );
    }

    if (newStatus !== allowedNext) {
      throw Object.assign(
        new Error(
          `Transição inválida: '${currentStatus}' → '${newStatus}'. Transição permitida: '${currentStatus}' → '${allowedNext}'`,
        ),
        { statusCode: 400 },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus as any },
    });

    return updated;
  }
}
