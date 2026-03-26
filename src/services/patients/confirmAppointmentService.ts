import { prisma } from "../../database/prisma";
import { AppointmentStatus } from "../../types/enums";

export class ConfirmAppointmentService {
  async execute(appointmentId: string, userId: string): Promise<void> {
    // Verifica que a consulta pertence ao paciente autenticado
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patient: { userId },
      },
      select: { id: true, status: true },
    });

    if (!appointment) {
      throw new Error("Consulta não encontrada");
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new Error("Apenas consultas com status SCHEDULED podem ser confirmadas");
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: userId,
      },
    });
  }
}
