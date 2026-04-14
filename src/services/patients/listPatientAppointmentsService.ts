import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import type { PatientAppointmentListItem, PatientAppointmentListResult } from "../../types/patient";

dayjs.extend(utc);

export class ListPatientAppointmentsService {
  private repository = new PatientDashboardRepository();

  async execute(userId: string, status?: string): Promise<PatientAppointmentListResult> {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    const rows = await this.repository.listAppointments(patient.id, status);

    const appointments: PatientAppointmentListItem[] = rows.map((row) => ({
      id: row.id,
      clinicId: row.clinicId,
      professionalId: row.professionalId,
      // Usa UTC para preservar o dia do campo @db.Date sem deslocar timezone.
      appointmentDate: dayjs.utc(row.appointmentDate).format("YYYY-MM-DD"),
      startTime: row.startTime,
      endTime: row.endTime,
      type: row.type,
      status: row.status,
      channel: row.channel,
      notes: row.notes ?? null,
      professionalName: row.professional.user.name,
      professionalAvatarUrl: row.professional.user.avatarUrl ?? null,
      primarySpecialty: row.professional.specialties[0]?.specialty.name ?? null,
      clinicName: row.clinic.tradeName,
    }));

    return { total: appointments.length, appointments };
  }
}
