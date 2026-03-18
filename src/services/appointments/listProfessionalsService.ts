import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { ProfessionalListItem } from "../../types/appointment";

export class ListProfessionalsService {
  private repository = new AppointmentRepository();

  async execute(clinicId: string): Promise<ProfessionalListItem[]> {
    const raw = await this.repository.listProfessionals(clinicId);

    return raw.map((p) => ({
      id: p.id,
      userId: p.user.id,
      name: p.user.name,
      specialty: p.specialties[0]?.specialty.name ?? null,
      defaultAppointmentDuration: p.defaultAppointmentDuration,
      bufferTime: p.bufferTime,
      calendarColor: p.calendarColor,
    }));
  }
}
