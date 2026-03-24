import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { CompletedPatientItem } from "../../types/appointment";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export class ListCompletedPatientsService {
  private repository = new AppointmentRepository();

  async execute(userId: string, clinicId: string): Promise<CompletedPatientItem[]> {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const rows = await this.repository.listCompletedPatients(clinicId, professional.id);

    return rows.map((row) => ({
      patientId: row.patientId,
      name: row.patient.user.name,
      avatarUrl: row.patient.user.avatarUrl,
      lastCompletedAt: dayjs(row.appointmentDate).tz(DEFAULT_TIMEZONE).format("YYYY-MM-DD"),
    }));
  }
}
