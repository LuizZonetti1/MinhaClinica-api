import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { PatientSearchItem } from "../../types/appointment";

export class SearchPatientsService {
  private repository = new AppointmentRepository();

  async execute(q: string, clinicId: string): Promise<PatientSearchItem[]> {
    if (q.trim().length < 2) {
      throw Object.assign(new Error("A busca precisa ter ao menos 2 caracteres"), {
        statusCode: 400,
      });
    }

    const raw = await this.repository.searchPatients(q.trim(), clinicId);

    return raw.map((p) => ({
      patientId: p.id,
      userId: p.user.id,
      name: p.user.name,
      cpf: p.cpf,
      phone: p.user.phone,
      avatarUrl: p.user.avatarUrl,
      status: p.user.status,
    }));
  }
}
