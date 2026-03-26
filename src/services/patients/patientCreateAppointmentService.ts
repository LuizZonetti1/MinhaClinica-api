import { prisma } from "../../database/prisma";
import type { AppointmentCreatedResult } from "../../types/appointment";
import { AppointmentChannel } from "../../types/enums";
import type { PatientBookingInput } from "../../types/patient";
import { CreateAppointmentService } from "../appointments/createAppointmentService";

export class PatientCreateAppointmentService {
  private createService = new CreateAppointmentService();

  async execute(input: PatientBookingInput, userId: string): Promise<AppointmentCreatedResult> {
    // Resolve userId → patientId
    const patient = await prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    return this.createService.execute(
      {
        patientId: patient.id,
        professionalId: input.professionalId,
        appointmentDate: input.appointmentDate,
        startTime: input.startTime,
        type: input.type,
        notes: input.notes,
        channel: input.channel ?? AppointmentChannel.ONLINE_PORTAL,
      },
      input.clinicId,
      userId,
    );
  }
}
