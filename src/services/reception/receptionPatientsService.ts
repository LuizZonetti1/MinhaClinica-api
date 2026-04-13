import { prisma } from "../../database/prisma";
import type { ReceptionAppointmentItem } from "../../types/patient";

export class ListReceptionPatientAppointmentsService {
  async execute(clinicId: string, patientId: string): Promise<ReceptionAppointmentItem[]> {
    // Garante que o paciente tem consultas nessa clínica (proteção multi-tenant)
    const belongsToClinic = await prisma.appointment.findFirst({
      where: { clinicId, patientId },
      select: { id: true },
    });

    if (!belongsToClinic) {
      throw Object.assign(new Error("Paciente não encontrado nesta clínica"), { statusCode: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { clinicId, patientId },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        notes: true,
        professional: {
          select: {
            user: { select: { name: true } },
            specialties: {
              where: { isPrimary: true },
              take: 1,
              select: { specialty: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    });

    return appointments.map((a) => ({
      id: a.id,
      date: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime,
      professionalName: a.professional.user.name,
      professionalSpecialty: a.professional.specialties[0]?.specialty.name ?? null,
      appointmentType: a.type,
      status: a.status,
      notes: a.notes,
    }));
  }
}
