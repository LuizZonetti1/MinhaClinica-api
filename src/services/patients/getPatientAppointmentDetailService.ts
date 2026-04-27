import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";

dayjs.extend(utc);

export class GetPatientAppointmentDetailService {
  private repository = new PatientDashboardRepository();

  async execute(appointmentId: string, userId: string) {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        professional: {
          select: {
            user: { select: { name: true } },
            specialties: {
              where: { isPrimary: true },
              select: { specialty: { select: { name: true } } },
              take: 1,
            },
          },
        },
        patient: {
          select: { id: true },
        },
        clinic: {
          select: { tradeName: true },
        },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    if (appointment.patient.id !== patient.id) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    return {
      id: appointment.id,
      appointmentDate: dayjs.utc(appointment.appointmentDate).format("YYYY-MM-DD"),
      startTime: appointment.startTime,
      status: appointment.status,
      professionalName: appointment.professional.user.name,
      clinicName: appointment.clinic.tradeName,
      primarySpecialty:
        appointment.professional.specialties[0]?.specialty.name ?? null,
    };
  }
}
